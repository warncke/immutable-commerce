'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var badRequest = require('../lib/bad-request')

/* public functions */
module.exports = requireNotActivated

/**
 * @function requireNotActivated
 *
 * @param {object} obj - object that must not be activated
 *
 * @returns {Promise}
 */
function requireNotActivated (obj) {
    // if input is not an object then return object
    if (!isObject(obj)) {
        return obj
    }
    // get key name for activate create time
    // which determins if object is activated
    var activateKey = getActivateKey(obj)
    // if object does not have a activate key then return object
    if (!activateKey) {
        return obj
    }
    // if there is not value set for activate then return object
    if (!obj[activateKey]) {
        return obj
    }

    /* TODO: do time evaluation ? */

    // return an error
    return badRequest('illegal operation on activated resource')
}

/* private functions */

/**
 * @function getActivateKey
 *
 * @param {object} obj - object that must not be activated
 *
 * @returns {String}
 */
function getActivateKey (obj) {
    // get all keys
    var keys = Object.keys(obj)
    // look for activate key
    for (var i=0; i < keys.length; i++) {
        var  key = keys[i]
        // return key if it ends with ActivateCreateTime
        if (key.match(/ActivateCreateTime$/)) {
            return key
        }
    }
}
