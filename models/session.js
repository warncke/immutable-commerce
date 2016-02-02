'use strict';

/* npm modules */
var crypto = require('crypto')
var promise = require('bluebird')

/* promisified modules/methods */
var randomBytes = promise.promisify(crypto.randomBytes)

/* application libraries */
var db = require('../lib/database')
var stableId = require('../lib/stable-id')

function Session (req, res, next) {
    var session = this
    session.req = req
    session.res = res
    session.next = next
    session.data = {}
}

Session.prototype.authRequest = function authSession (session) {
    var session = this

    session.next()
}

Session.prototype.clearSession = function clearSession () {
    var session = this;
    // clear session cookie
    session.req.cookies.sessionId = undefined
    // clear session
    session.data = {}
}

Session.prototype.connectDrupalUser = function connectDrupalUser () {
    var session = this
    // get drupal session id from cookie
    var drupalSessionId = session.getDrupalSessionId()
    // drupal session cookie does not exist
    if (!drupalSessionId) {
        // if the existing session is connected to a drupal user who has now
        // logged out then session needs to be cleared
        if (session.data.drupalUserId) {
            session.clearSession()
        }
        // no drupal user to connect
        return;
    }
    // lookup drupal user id from session id in drupal database
    return db('drupal').query(
        'SELECT uid FROM sessions WHERE sid = :drupalSessionId',
        {drupalSessionId: drupalSessionId}
    ).then(function (res) {
        // drupal session is valid
        if (res.info.numRows == 1) {
            session.connectDrupalUserWithId(res[0].uid)
        }
        // drupal session is not valid
        else {
            // if the current session is connected to a drupal user id then clear it
            if (session.data.drupalUserId) {
                session.clearSession()
            }
        }
    })  
}

Session.prototype.connectDrupalUserWithId = function connectDruaplUserWithId (drupalUserId) {
    var session = this
    // session is already connected to drupal account
    if (session.data.drupalUserId) {
        // if drupal user id for current session does not match currently logged in drupal user
        // then clear session and use current drupal user id
        if (session.data.drupalUserId != drupalUserId) {
            // clear session
            session.clearSession()
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
            session.clearSession()
            // set original session id on new session
            session.data.originalSessionId = originalSessionId
        }
        // set drupal user id on session
        session.data.drupalUserId = drupalUserId
    }
}

Session.prototype.createAccount = function createAccount () {
    var session = this
    /* build account data */
    var account = {
        drupalUserId: session.data.drupalUserId
    }
    // account id is based on drupalUserId only which must be unique
    account.accountId = stableId(account)
    // use request time for create time
    account.accountCreateTime = session.req.requestTimestamp
    // create account
    return db('immutable').query(
        'INSERT INTO account VALUES(UNHEX(:accountId), :drupalUserId, :accountCreateTime)',
        account
    ).then(function (res) {
        // create new session linked to account
        session.data.accountId = account.accountId
        session.data.accountCreateTime = account.accountCreateTime
    })
}

Session.prototype.createSession = function createSession () {
    var session = this
    // if the current session id matches the cookie session id then do not create new session
    if (session.req.cookies.sessionId && session.req.cookies.sessionId === session.data.sessionId) {
        return;
    }

    /* build session data */

    // if sessionId cookie is already set and a new session is being
    // created then it needs to be linked to the original session
    session.data.originalSessionId = session.data.originalSessionId || session.req.cookies.sessionId || session.data.sessionId
    // get ip address passed from reverse proxy or client ip
    session.data.ipAddress = session.req.headers['x-forwarded-for']
        || session.req.connection.remoteAddress
    // set createTime for session based on request time
    session.data.sessionCreateTime = session.req.requestTimestamp

    // get random data to use as session id
    return randomBytes(16).then(function (buf) {
        // get random data as hex string
        session.data.sessionId = buf.toString('hex').toUpperCase()
        // insert session into database
        return session.insertSession()
    })
}

Session.prototype.getAccount = function getAccount () {
    var session = this
    // must have drupal user id
    if (!session.data.drupalUserId) {
        return;
    }
    // attempt to retrieve existing account by drupal user id
    return db('immutable').query(
        'SELECT HEX(accountId) AS accountId, drupalUserId, accountCreateTime FROM account WHERE drupalUserId = :drupalUserId',
        {drupalUserId: session.data.drupalUserId}
    ).then(function (res) {
        // account with drupal user id already exists
        if (res.info.numRows == 1) {
            session.data.accountId = res[0].accountId
            session.data.accountCreateTime = res[0].accountCreateTime
        }
        // account does not exist
        else {
            return session.createAccount()
        }
    })
}

Session.prototype.getDrupalSessionId = function getDruaplSessionId () {
    var session = this
    // get cookie names
    var cookieNames = Object.keys(session.req.cookies)
    // loop over all cookie names
    for (var i=0; i < cookieNames.length; i++) {
        var cookieName = cookieNames[i]
        // look for cookie starting with SESS followed by hex string
        if (cookieName.substr(0, 4) == 'SESS' && cookieName.length == 36) {
            return session.req.cookies[cookieName]
        }
    }
}

Session.prototype.init = function init () {
    var session = this
    // attempt to load existing session
    return session.loadSession()
    // attempt to connect to drupal user account    
    .then(function () {
        return session.connectDrupalUser()
    })
    // select existing or create new account if logged in drupal user was found
    .then(function () {
        return session.getAccount()
    })
    // create a new session if needed
    .then(function () {
        return session.createSession()
    })
    // finally perform check to see if user is authorized to make request
    .then(function () {
        return session.authRequest()
    })
    // catch errors
    .catch(function (err) {
        session.next(err)
    })
}

Session.prototype.insertSession = function insertSession () {
    var session = this
    // insert new session
    return db('immutable').query(
        'INSERT INTO session VALUES(UNHEX(:sessionId), UNHEX(:originalSessionId), UNHEX(:accountId), :ipAddress, :sessionCreateTime)',
        session.data
    ).then(function (res) {
        session.setCookie()
    })
}

Session.prototype.loadSession = function loadSession () {
    var session = this
    // attempt to load session from database
    return session.selectSession().then(function (res) {
        // session was found
        if (res.info.numRows == 1) {
            session.data = res[0]
            session.setCookie()
        }
        // session was not found
        else {
            session.clearSession()
        }
    })
}

Session.prototype.selectSession = function selectSession () {
    var session = this
    // attempt to load session from database
    return db('immutable').query(
        'SELECT HEX(s.sessionId) AS sessionId, HEX(s.originalSessionId) AS originalSessionId, HEX(s.accountId) AS accountId, ipAddress, sessionCreateTime, a.drupalUserId, a.accountCreateTime FROM session s LEFT JOIN account a ON s.accountId = a.accountId WHERE UNHEX(:sessionId) = s.sessionId',
        {sessionId: session.req.cookies.sessionId}
    )
}

Session.prototype.setCookie = function setCookie () {
    var session = this
    // set session cookie
    session.res.cookie('sessionId', session.data.sessionId)
}

function auth (req, res, next) {
    // create a new session instance
    req.session = new Session(req, res, next)
    // intialize session
    req.session.init()
}

module.exports = {
    auth: auth,
}