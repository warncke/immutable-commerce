'use strict';

/* npm modules */
var crypto = require('crypto')
var moment = require('moment')
var promise = require('bluebird')

/* promisified modules/methods */
var randomBytes = promise.promisify(crypto.randomBytes)

/* application libraries */
var accountModel = require('../models/account')
var authModel = require('../models/auth')
var db = require('../lib/database')
// var instance = require('./instance')
var sessionModel = require('../models/session')
var shopperProfileModel = require('../models/shopper-profile')
// var stableId = require('../lib/stable-id')

function Session(data) {
    var session = this
    // authentication data
    session.auth = {}
    // data that can optionally be set on initialization
    session.accountId = data.accountId
    session.requestTimestamp = data.requestTimestamp
    session.sessionId = data.sessionId
    // data used for logging
    session.moduleCallId = undefined
}

/* public functions */
Session.prototype = {
    authDrupalUserForSession: authDrupalUserForSession,
    clearSession: clearSession,
    createAccount: createAccount,
    createAuth: createAuth,
    createSession: createSession,
    createSessionAccount: createSessionAccount,
    getAccount: getAccount,
    getDrupalSessionId: getDrupalSessionId,
    getFrUid: getFrUid,
    init: init,
    loadAuthByAccountId: loadAuthByAccountId,
    loadDrupalUser: loadDrupalUser,
    loadSession: loadSession,
    setCookie: setCookie,
    toJSON: toJSON,
}

function authDrupalUserForSession(req, res) {
    var session = this
    // if the session is not connected to any drupal account then auth not needed
    if (!session.auth.drupal) {
        return
    }
    // session is linked to drupal account but no drupal user - clear session
    if (!session.drupalUser) {
        return session.clearSession(req, res)
    }
    // session drupal user does not match loaded drupal user - clear session
    if (session.auth.drupal.authProviderAccountId !== session.drupalUser.uid) {
        // save drupal user
        var drupalUser = session.drupalUser
        // clear/recreate session
        return session.clearSession(req, res)
        // re-add drupal user
        .then(function () {
            session.drupalUser = drupalUser
        })
    }
}

function clearSession(req, res) {
    var session = this;
    // clear session cookie
    req.cookies.sessionId = undefined
    // clear auth data
    session.auth = {}
    // clear drupal user
    session.drupalUser = undefined
    // clear session
    session.accountId = undefined
    session.sessionId = undefined
    // now that existing session has been cleared create a new one
    return session.createSession(req, res)
}

function loadDrupalUser(req, res) {
    var session = this
    // get drupal session id from cookie
    var drupalSessionId = session.getDrupalSessionId(req, res)
    // drupal session cookie does not exist
    if (!drupalSessionId) {
        return
    }
    // lookup drupal user id from session id in drupal database
    return db('drupal').query(
        'SELECT u.uid, u.mail, GROUP_CONCAT(DISTINCT r.rid) AS roles FROM users u JOIN sessions s ON u.uid = s.uid LEFT JOIN users_roles ur ON u.uid = ur.uid LEFT JOIN role r ON ur.rid = r.rid WHERE s.sid = :drupalSessionId GROUP BY u.uid',
        {drupalSessionId: drupalSessionId}
    ).then(function (drupalUser) {
        // return if not found or this is fake anonymous user
        if (!(drupalUser.length && drupalUser[0].uid > 0)) {
            return
        }
        // store drupal user
        session.drupalUser = drupalUser[0]
        // convert roles to array
        try {
            session.drupalUser.roles = JSON.parse('['+session.drupalUser.roles+']')
        }
        catch (err) {
            session.drupalUser.roles = []
        }
    })
}

function createAccount(req, res) {
    var session = this
    // if there is already an account do nothing
    if (session.accountId) {
        return Promise.resolve()
    }
    // create account
    return accountModel.createAccount({
        frUid: session.getFrUid(req),
        session: session,
    })
    // set account id on session
    .then(function (account) {
        session.accountId = account.accountId
        // create session account entry
        return session.createSessionAccount(req, res)
    })
}

function createAuth(req, res) {
    var session = this
    // create auth record
    return authModel.createAuth({
        authProviderAccountId: session.drupalUser.uid,
        authProviderData: {
            email: session.drupalUser.mail,
            roles: session.drupalUser.roles,
        },
        authProviderName: 'drupal',
        accountId: session.accountId,
        session: session,
    })
    // success
    .then(function (auth) {
        // add auth data to session
        session.auth[auth.authProviderName] = auth
    })
}

function createSession(req, res) {
    var session = this
    // if there is already an active session do nothing
    if (session.sessionId) {
        return Promise.resolve()
    }
    // get random data to use as session token
    return randomBytes(16).then(function (buf) {
        // insert new session
        return sessionModel.createSession({
            session: session,
            token: buf.toString('hex').toUpperCase(),
        })
        // success
        .then(function (resSession) {
            // update internal state values
            session.sessionId = resSession.sessionId
            // set session cookie with new session id
            session.setCookie(req, res)
        })
    })
}

function createSessionAccount(req, res) {
    var session = this
    var initialFrUid
    // insert new session account link
    return sessionModel.createSessionAccount({
        session: session,
    })
    // Get the frUid of session, then get account
    .then(function () {
        // Grab frUid before checking account for one
        initialFrUid = session.getFrUid(req);
        // Get frUid of account
        return accountModel.getAccountById({
            accountId: session.accountId,
            session: session
        })
    })
    // Got account, check if frUid is different
    .then(function (account) {
        var initialShopperProfile

        // frUid doesn't match, so get current profile of initial frUid first
        return shopperProfileModel.getCurrentShopperProfile({
            frUid: session.getFrUid(req),
            session: session
        }).then(function (shopperProfile) {
            initialShopperProfile = shopperProfile
            // Update the frUid and get that profile next
            setFrUid(req, res, account.frUid)
            // Get current profile of new frUid
            return shopperProfileModel.getCurrentShopperProfile({
                frUid: session.getFrUid(req),
                session: session
            })
        }).then(function (shopperProfile) {
            var mergeData
            // Compare initialShopperProfile to shopperProfile and use intialShopperProfile data for merge if it is newer
            if (shopperProfile.shopperProfileId !== initialShopperProfile.shopperProfileId && moment(shopperProfile.shopperProfileCreateTime).isBefore(initialShopperProfile.shopperProfileCreateTime)) {
                mergeData = initialShopperProfile.data
            }

            // Tag account linked profile with auth email if available
            if (session.auth && Object.keys(session.auth).length > 0) {
                var auth = session.auth[Object.keys(session.auth)[0]]
                if (auth.authProviderData && auth.authProviderData.email) {
                    shopperProfile.data.email = auth.authProviderData.email
                }
            }
            // Fall back to drupalUser for email
            else if (session.drupalUser && session.drupalUser.mail) {
                shopperProfile.data.email = session.drupalUser.mail
            }

            // Save the profile, passing in the mergeData for any extensions to deal with the merge
            return shopperProfileModel.createShopperProfile({
                frUid: session.getFrUid(req),
                data: shopperProfile.data,
                mergeData: initialShopperProfile.data,
                originalShopperProfileId: shopperProfile.originalShopperProfileId,
                parentShopperProfileId: shopperProfile.shopperProfileId,
                session: session,
            })
        })
    })
}

function getAccount(req, res) {
    var session = this
    // must have drupal user id
    if (!session.drupalUser) {
        return
    }
    // attempt to retrieve existing account by drupal user id
    return authModel.getAuthByProviderNameAndAccountId({
        authProviderName: 'drupal',
        authProviderAccountId: session.drupalUser.uid,
    })
    // success
    .then(function (auth) {
        // auth record already exists for this drupal account
        if (auth) {
            // store auth data
            session.auth[auth.authProviderName] = auth
            // if session already has an account id that does not match
            // the account id for the drupal session then clear the session
            if (session.accountId && session.accountId !== auth.accountId) {
                // clear session
                return session.clearSession(req, res)
                // link session to account
                .then(function () {
                    // set account id for session
                    session.accountId = auth.accountId
                    // store auth data
                    session.auth[auth.authProviderName] = auth
                    // link session to account
                    return session.createSessionAccount(req, res)
                })
            }
            // current session is not linked to account
            else if (!session.accountId) {
                // set account id for session
                session.accountId = auth.accountId
                // link session to account
                return session.createSessionAccount(req, res)
            }
        }
        // auth record does not exist
        else {
            // create account if session is not already linked to one
            return session.createAccount(req, res)
            // create auth record
            .then(function () {
                return session.createAuth()
            })
        }
    })
}

function getDrupalSessionId(req, res) {
    // get cookie names
    var cookieNames = Object.keys(req.cookies)
    // loop over all cookie names
    for (var i=0; i < cookieNames.length; i++) {
        var cookieName = cookieNames[i]
        // look for cookie starting with SESS followed by hex string
        if (cookieName.substr(0, 4) === 'SESS' && cookieName.length === 36) {
            return req.cookies[cookieName]
        }
    }
}

function getFrUid(req) {
    // Return fruid cookie
    return req.cookies.fruid;
}

function init(req, res, next) {
    var session = this
    // attempt to load existing session
    return session.loadSession(req, res)
    // attempt to load drupal user from drupal session cookie
    .then(function () {
        return session.loadDrupalUser(req, res)
    })
    // if both local session and drupal session already exist then make
    // sure these two sessions are for the same account
    .then(function () {
        return session.authDrupalUserForSession(req, res)
    })
    // select existing or create new account if logged in drupal user was found
    .then(function () {
        return session.getAccount(req, res)
    })
    // create a new session if needed
    .then(function () {
        return session.createSession(req, res)
    })
    // cleanup
    .then(function () {
        // call request handler
        next()
    })
    // catch errors
    .catch(function (err) {
        // call error handler
        next(err)
    })
}

function loadAuthByAccountId(req, res) {
    var session = this
    // if not account id then nothing to do
    if (!session.accountId) {
        return Promise.resolve()
    }
    // load auth records if any
    return authModel.getAuthByAccountId({
        accountId: session.accountId,
        session: session,
    })
    // success
    .then(function (auths) {
        // copy auth data to session
        for (var i=0; i < auths.length; i++) {
            var auth = auths[i]
            // session auth keyed by auth provider name
            session.auth[auth.authProviderName] = auth
        }
    })
}

function loadSession(req, res) {
    var session = this
    // if session id is not set then get from cookie
    session.sessionId = session.sessionId || req.cookies.sessionId
    // if there is no session id then nothing to do
    if (!session.sessionId) {
        return session.clearSession(req, res)
    }
    // attempt to load session from database
    return sessionModel.getSessionById({
        session: session,
        sessionId: session.sessionId,
    })
    .then(function (resSession) {
        // session was not found
        if (!resSession) {
            return session.clearSession(req, res)
        }
        // store session
        session.accountId = resSession.accountId
        session.sessionId = resSession.sessionId
        session.setCookie(req, res)
        // load auth records for account
        return session.loadAuthByAccountId(req, res)
    })
}

function setCookie(req, res) {
    var session = this
    // set session cookie
    res.cookie('sessionId', session.sessionId)
}

function toJSON() {
    var session = this
    // hide values that should not be serialized - this should be
    // refactored more extensively in the future
    return {
        accountId: session.accountId,
        auth: session.auth,
        requestTimestamp: session.requestTimestamp,
        sessionId: session.sessionId,
    }
}

function auth(req, res, next) {
    // create a new session instance
    var session = req.session = new Session(req)
    // intialize session
    session.init(req, res, next)
}

/* Private Methods */
function setFrUid(req, res, frUid) {
    // Initialize an expiration date for cookie
    var expiration = new Date()
    // Move to 365 days in the future
    expiration.setTime(expiration.getTime() + (365 * 24 * 60 * 60 * 1000))
    // Set cookie
    res.cookie('fruid', frUid, { expires: expiration })
    // Update request cookies entry also
    req.cookies.fruid = frUid
}

module.exports = {
    auth: auth,
    Session: Session,
}
