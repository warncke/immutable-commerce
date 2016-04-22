'use strict'

/* application libraries */
var accessDenied = require('./access-denied')

/* public functions */
module.exports = requireAccountDeny

/**
 * @function requireAccountDeny
 *
 * @param {object} req - request
 *
 * @returns {Promise}
 */
function requireAccountDeny (req) {
    // check if session has account
    return req.session.accountId
        // resolve if accountId set for session
        ? Promise.resolve()
        // return reject with access denied error
        : accessDenied()
}