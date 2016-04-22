'use strict'

/* npm libraries */
var jsonStableStringify = require('json-stable-stringify')

/* application libraries */
var log = require('./log')

/* public libraries */
module.exports = stringify

/**
 * @function stringify
 *
 * @param {any} data - input to be stringified
 *
 * @returns {string}
 */
function stringify (data) {
    // catch errors
    try {
        return jsonStableStringify(data)
    }
    catch (err) {
        log.error(err)
    }
}