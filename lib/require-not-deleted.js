'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var badRequest = require('./bad-request')

/* public functions */
module.exports = requireNotDeleted

/**
 * @function requireNotDeleted
 *
 * @param {object} obj - object that must not be deleted
 *
 * @returns {Promise}
 */
function requireNotDeleted (obj) {
    // if input is not an object then return object
    if (!isObject(obj)) {
        return obj
    }
    // get key name for delete create time
    // which determins if object is deleted
    var deleteKey = getDeleteKey(obj)
    // if object does not have a delete key then return object
    if (!deleteKey) {
        return obj
    }
    // if there is not value set for delete then return object
    if (!obj[deleteKey]) {
        return obj
    }

    /* TODO: do time evaluation ? */

    // return an error
    return badRequest('illegal operation on deleted resource')
}

/* private functions */

/**
 * @function getDeleteKey
 *
 * @param {object} obj - object that must not be deleted
 *
 * @returns {String}
 */
function getDeleteKey (obj) {
    // get all keys
    var keys = Object.keys(obj)
    // look for delete key
    for (var i=0; i < keys.length; i++) {
        var  key = keys[i]
        // return key if it ends with DeleteCreateTime
        if (key.match(/DeleteCreateTime$/)) {
            return key
        }
    }
}