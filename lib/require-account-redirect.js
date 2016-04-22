'use strict'

/* application libraries */
var redirect = require('./redirect')

/* public functions */
module.exports = requireAccountRedirect

/**
 * @function requireAccount
 *
 * @param {object} req - request
 *
 * @returns {Promise}
 */
function requireAccountRedirect (req) {
    // check if session has account
    return req.session.accountId
        // resolve if accountId set for session
        ? Promise.resolve()
        // return reject with redirect if not
        : redirect('/site/user/register?redirect=https://'+req.headers['x-forwarded-host']+req.url)
}