'use strict'

/* npm libraries */
var isObject = require('isobject')
var jsonStableStringify = require('json-stable-stringify')

/* application libraries */
var log = require('./log')

/* public libraries */
module.exports = stringifyObject

/**
 *
 * @function stringifyObject
 *
 * @param {any} data - input to be stringified
 *
 * @returns {string}
 */
function stringifyObject (data) {
    // require a non-array object
    if (!isObject(data)) {
        data = {}
    }
    // catch errors
    try {
        return jsonStableStringify(data)
    }
    catch (err) {
        // log error
        log.error(err)
        // return an empty object on error
        return '{}'
    }
}