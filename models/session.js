'use strict'

/* npm libraries */

/* application libraries */

var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('Session', {
    createSession: createSession,
    getSessionById: getSessionById,
})

/**
 * @function createSession
 *
 * @param {string} accountId - hex account id
 * @param {string} ipAddress
 * @param {string} originalSessionId - hex id of parent cart being modified
 * @param {object} session - request session
 * @param {string} sessionCreateTime
 * @param {string} sessionId - hex session id
 * 
 * @returns {Promise}
 */
function createSession (args) {
    // insert new session
    return db('immutable').query(
        'INSERT INTO session VALUES(UNHEX(:sessionId), UNHEX(:originalSessionId), UNHEX(:accountId), :ipAddress, :sessionCreateTime)',
        args,
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
        'SELECT HEX(s.sessionId) AS sessionId, HEX(s.originalSessionId) AS originalSessionId, HEX(s.accountId) AS accountId, ipAddress, sessionCreateTime, a.drupalUserId, a.accountCreateTime FROM session s LEFT JOIN account a ON s.accountId = a.accountId WHERE UNHEX(:sessionId) = s.sessionId',
        args,
        undefined,
        args.session
    )
}