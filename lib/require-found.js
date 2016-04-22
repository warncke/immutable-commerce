'use strict'

/* application libraries */
var notFound = require('../lib/not-found')

/* public functions */
module.exports = requireFound

/**
 * @function requireFound
 *
 * @param {object} obj - object that must be defined
 *
 * @returns {Promise}
 */
function requireFound (obj) {
    // return promise reject with 404 error if object is falsy
    return obj ? obj : notFound()
}