'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var accessDenied = require('./access-denied')

/* public functions */
module.exports = checkAccessByFrUidOrSession

/**
 * @checkAccessByFrUidOrSession
 *
 * @param {object} obj - obj containing a sessionId and/or frUid
 * @param {string} frUid - frUid attempting to access object
 * @param {object} session - session attempting to access object
 *
 * @returns {object|undefined} - original object or promise rejected with access denied
 */
function checkAccessByFrUidOrSession (obj, frUid, session) {
    // return undefined on invalid input
    if (!isObject(obj) || !isObject(session)) {
        return
    }
    // return undefined if object does not have any identifiers
    if (!obj.sessionId && !obj.frUid) {
        return
    }
    // check access by frUid if it is set on object - otherwise
    // check access by session id
    return obj.frUid
        ? checkAccessByFrUid (obj, frUid)
        : checkAccessBySession (obj, session)
}

/* private functions */

/**
 * @checkAccessByFrUid
 *
 * @param {object} obj - obj containing a sessionId and/or frUid
 * @param {string} frUid - frUid attempting to access object
 *
 * @returns {object} - original object or promise rejected with access denied
 */
function checkAccessByFrUid (obj, frUid) {
    // require frUid to match object frUid
    return obj.frUid === frUid ? obj : accessDenied()
}

/**
 * @checkAccessBySession
 *
 * @param {object} obj - obj containing a sessionId and/or frUid
 * @param {object} session - session attempting to access object
 *
 * @returns {object} - original object or promise rejected with access denied
 */
function checkAccessBySession (obj, session) {
    // require sessionId to match object sessionId
    return obj.sessionId === session.sessionId ? obj : accessDenied()
}
