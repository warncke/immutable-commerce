'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var accessDenied = require('./access-denied')

/* public functions */
module.exports = checkAccessByAccountOrSession

/**
 * @checkAccessByAccountOrSession
 *
 * @param {object} obj - obj containing a sessionId and/or accountId
 * @param {object} session - session attempting to access object
 *
 * @returns {object|undefined} - original object or promise rejected with access denied
 */
function checkAccessByAccountOrSession (obj, session) {
    // return undefined on invalid input
    if (!isObject(obj) || !isObject(session)) {
        return
    }
    // return undefined if object does not have any identifiers
    if (!obj.sessionId && !obj.accountId) {
        return
    }
    // check access by account id if it is set on object - otherwise
    // check access by session id
    return obj.accountId
        ? checkAccessByAccount (obj, session)
        : checkAccessBySession (obj, session)
}

/* private functions */

/**
 * @checkAccessByAccount
 *
 * @param {object} obj - obj containing a sessionId and/or accountId
 * @param {object} session - session attempting to access object
 *
 * @returns {object} - original object or promise rejected with access denied
 */
function checkAccessByAccount (obj, session) {
    // require session accountId to match object accountId
    return obj.accountId === session.accountId ? obj : accessDenied()
}

/**
 * @checkAccessBySession
 *
 * @param {object} obj - obj containing a sessionId and/or accountId
 * @param {object} session - session attempting to access object
 *
 * @returns {object} - original object or promise rejected with access denied
 */
function checkAccessBySession (obj, session) {
    // require sessionId to match object sessionId
    return obj.sessionId === session.sessionId ? obj : accessDenied()
}