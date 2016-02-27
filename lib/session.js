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

Session.prototype.init = function init (req, res, next) {
    var session = this
    // attempt to load existing session
    return session.loadSession(req, res)
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