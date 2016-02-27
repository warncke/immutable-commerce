'use strict';

/* npm modules */
var crypto = require('crypto')
var promise = require('bluebird')

/* promisified modules/methods */
var randomBytes = promise.promisify(crypto.randomBytes)

/* application libraries */
var db = require('../lib/database')
var sessionModel = require('../models/session')
var stableId = require('../lib/stable-id')

function Session (data) {
    var session = this
    // session data as stored in database
    session.data = {}
    // data that can optionally be set on initialization
    session.accountId = data.accountId;
    session.originalSessionId = data.originalSessionId;
    session.requestId = data.requestId;
    session.requestTimestamp = data.requestTimestamp;
    session.sessionId = data.sessionId;
    // data used for logging
    session.moduleCallId = undefined
}

Session.prototype.authRequest = function authSession (req, res) {
    var session = this
}

Session.prototype.clearSession = function clearSession (req, res) {
    var session = this;
    // clear session cookie
    req.cookies.sessionId = undefined
    // clear session
    session.data = {}
    session.accountId = undefined
    session.sessionId = undefined
    session.originalSessionId = undefined
}

Session.prototype.connectDrupalUser = function connectDrupalUser (req, res) {
    var session = this
    // get drupal session id from cookie
    var drupalSessionId = session.getDrupalSessionId(req, res)
    // drupal session cookie does not exist
    if (!drupalSessionId) {
        // if the existing session is connected to a drupal user who has now
        // logged out then session needs to be cleared
        if (session.data.drupalUserId) {
            session.clearSession(req, res)
        }
        // no drupal user to connect
        return;
    }
    // lookup drupal user id from session id in drupal database
    return db('drupal').query(
        'SELECT uid FROM sessions WHERE sid = :drupalSessionId',
        {drupalSessionId: drupalSessionId}
    ).then(function (drupalRes) {
        // drupal session is valid
        if (drupalRes.length) {
            session.connectDrupalUserWithId(req, res, drupalRes[0].uid)
        }
        // drupal session is not valid
        else {
            // if the current session is connected to a drupal user id then clear it
            if (session.data.drupalUserId) {
                session.clearSession(req, res)
            }
        }
    })  
}

Session.prototype.connectDrupalUserWithId = function connectDruaplUserWithId (req, res, drupalUserId) {
    var session = this
    // session is already connected to drupal account
    if (session.data.drupalUserId) {
        // if drupal user id for current session does not match currently logged in drupal user
        // then clear session and use current drupal user id
        if (session.data.drupalUserId !== drupalUserId) {
            // clear session
            session.clearSession(req, res)
            // logged in drupal user
            if (drupalUserId > 0) {
                // use drupal user id from current drupal session
                session.data.drupalUserId = drupalUserId
            }
        }
    }
    // store drupal id in session if greater that 0
    else if (drupalUserId > 0) {
        // if this is an existing session without a drupal user id then a new session must
        // be created but it should be linked to the original session
        if (session.data.sessionId) {
            // save original session id
            var originalSessionId = session.data.sessionId
            // clear session
            session.clearSession(req, res)
            // set original session id on new session
            session.data.originalSessionId = originalSessionId
        }
        // set drupal user id on session
        session.data.drupalUserId = drupalUserId
    }
}

Session.prototype.createAccount = function createAccount (req, res) {
    var session = this
    /* build account data */
    var account = {
        drupalUserId: session.data.drupalUserId
    }
    // account id is based on drupalUserId only which must be unique
    account.accountId = stableId(account)
    // use request time for create time
    account.accountCreateTime = req.requestTimestamp
    // create account
    return db('immutable').query(
        'INSERT INTO account VALUES(UNHEX(:accountId), :drupalUserId, :accountCreateTime)',
        account
    ).then(function () {
        // create new session linked to account
        session.data.accountId = account.accountId
        session.data.accountCreateTime = account.accountCreateTime
    })
}

Session.prototype.createSession = function createSession (req, res) {
    var session = this
    // if the current session id matches the cookie session id then do not create new session
    if (req.cookies.sessionId && req.cookies.sessionId === session.data.sessionId) {
        return;
    }

    /* build session data */

    // if sessionId cookie is already set and a new session is being
    // created then it needs to be linked to the original session
    session.data.originalSessionId = session.data.originalSessionId || req.cookies.sessionId || session.data.sessionId
    // get ip address passed from reverse proxy or client ip
    session.data.ipAddress = req.headers['x-forwarded-for']
        || req.connection.remoteAddress
    // set createTime for session based on request time
    session.data.sessionCreateTime = req.requestTimestamp

    // get random data to use as session id
    return randomBytes(16).then(function (buf) {
        // get random data as hex string
        session.data.sessionId = buf.toString('hex').toUpperCase()
        // if this is a new session use id as original
        if (!session.data.originalSessionId) {
            session.data.originalSessionId = session.data.sessionId
        }
        // insert session into database
        return session.insertSession(req, res)
    })
}

Session.prototype.getAccount = function getAccount (req, res) {
    var session = this
    // must have drupal user id
    if (!session.data.drupalUserId) {
        return;
    }
    // attempt to retrieve existing account by drupal user id
    return db('immutable').query(
        'SELECT HEX(accountId) AS accountId, drupalUserId, accountCreateTime FROM account WHERE drupalUserId = :drupalUserId',
        {drupalUserId: session.data.drupalUserId}
    ).then(function (accountRes) {
        // account with drupal user id already exists
        if (accountRes.length) {
            session.data.accountId = accountRes[0].accountId
            session.data.accountCreateTime = accountRes[0].accountCreateTime
        }
        // account does not exist
        else {
            return session.createAccount(req, res)
        }
    })
}

Session.prototype.getDrupalSessionId = function getDruaplSessionId (req, res) {
    var session = this
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

Session.prototype.init = function init (req, res, next) {
    var session = this
    // attempt to load existing session
    return session.loadSession(req, res)
    // attempt to connect to drupal user account    
    .then(function () {
        return session.connectDrupalUser(req, res)
    })
    // select existing or create new account if logged in drupal user was found
    .then(function () {
        return session.getAccount(req, res)
    })
    // create a new session if needed
    .then(function () {
        return session.createSession(req, res)
    })
    // finally perform check to see if user is authorized to make request
    .then(function () {
        return session.authRequest(req, res)
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

Session.prototype.insertSession = function insertSession (req, res) {
    var session = this
    // insert new session
    return sessionModel.createSession({
        accountId: session.data.accountId,
        ipAddress: session.data.ipAddress,
        originalSessionId: session.data.originalSessionId,
        session: session,
        sessionCreateTime: session.data.sessionCreateTime,
        sessionId: session.data.sessionId,
    }).then(function () {
        // update internal state values
        session.accountId = session.data.accountId
        session.sessionId = session.data.sessionId
        session.originalSessionId = session.data.originalSessionId
        // set session cookie with new session id
        session.setCookie(req, res)
    })
}

Session.prototype.loadSession = function loadSession (req, res) {
    var session = this
    // attempt to load session from database
    return sessionModel.getSessionById({
        session: session,
        sessionId: req.cookies.sessionId,
    })
    .then(function (resSession) {
        // session was found
        if (resSession.length) {
            session.data = resSession[0]
            session.accountId = session.data.accountId
            session.sessionId = session.data.sessionId
            session.originalSessionId = session.data.originalSessionId
            session.setCookie(req, res)
        }
        // session was not found
        else {
            session.clearSession(req, res)
        }
    })
}

Session.prototype.setCookie = function setCookie (req, res) {
    var session = this
    // set session cookie
    res.cookie('sessionId', session.data.sessionId)
}

Session.prototype.toJSON = function () {
    var session = this
    // hide values that should not be serialized - this should be
    // refactored more extensively in the future
    return {
        accountId: session.accountId,
        originalSessionId: session.originalSessionId,
        requestId: session.requestId,
        requestTimestamp: session.requestTimestamp,
        sessionId: session.sessionId,
    }
}

function auth (req, res, next) {
    // create a new session instance
    var session = req.session = new Session(req)
    // intialize session
    session.init(req, res, next)
}

module.exports = {
    auth: auth,
    Session: Session,
}