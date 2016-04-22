'use strict'

/* public functions */
module.exports = basicAuthHeader

/**
 * @function basicAuthHeader
 *
 * @param {string} user - auth user
 * @param {string} pass - auth password
 *
 * @returns {string}
 */
function basicAuthHeader (user, pass) {
    return 'Basic ' + new Buffer(user + ':' + pass, 'utf8').toString('base64')
}