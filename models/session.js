'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var setId = require('../lib/set-id')

/* public functions */
module.exports = immutable.model('Session', {
    createSession: createSession,
    createSessionAccount: createSessionAccount,
    getSessionById: getSessionById,
})

/**
 * @function createSession
 *
 * @param {string} token - hex random data
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createSession (args) {
    // build session
    var session = {
        sessionCreateTime: args.session.requestTimestamp,
        sessionId: args.sessionId || args.session.sessionId,
        token: args.token,
    }
    // get id
    setId(session, 'sessionId')
    // insert new session
    return db('immutable').query(
        'INSERT INTO session VALUES(UNHEX(:sessionId), UNHEX(:token), :sessionCreateTime)',
        session,
        undefined,
        args.session
    )
    // success
    .then(function () {
        return session
    })
}

/**
 * @function createSessionAccount
 *
 * @param {string} accountId - hex id
 * @param {object} session - request session
 * @param {string} createSessionAccountCreateTime
 * @param {string} sessionId - hex id
 * 
 * @returns {Promise}
 */
function createSessionAccount (args) {
    // build data
    var sessionAccount = {
        accountId: args.accountId || args.session.accountId,
        sessionId: args.sessionId || args.session.sessionId,
        sessionAccountCreateTime: args.session.requestTimestamp,
    }
    // insert new session
    return db('immutable').query(
        'INSERT INTO sessionAccount VALUES(UNHEX(:sessionId), UNHEX(:accountId), :sessionAccountCreateTime)',
        sessionAccount,
        undefined,
        args.session
    )
}

/**
 * @function getSessionById
 *
 * @param {object} session
 * @param {string} sessionId - hex session id
 * 
 * @returns {Promise}
 */
function getSessionById (args) {
    // attempt to load session from database
    return db('immutable').query(
        'SELECT HEX(s.sessionId) AS sessionId, HEX(s.token) AS token, HEX(sa.accountId) AS accountId, s.sessionCreateTime, sa.sessionAccountCreateTime FROM session s LEFT JOIN sessionAccount sa ON s.sessionId = sa.sessionId WHERE UNHEX(:sessionId) = s.sessionId',
        args,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        return res.length ? res[0] : undefined
    })
}