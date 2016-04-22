'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var stableId = require('../lib/stable-id.js')

/* public functions */
module.exports = setId

/**
 * @function setId
 *
 * @param {object} obj - object to set id on
 * @param {string} idName - name of id property
 * @param {undefined|string} originalIdName - optional name of original id property
 *
 * @returns {object}
 */
function setId (obj, idName, originalIdName) {
    // require object
    if (!isObject(obj)) {
        // return whatever was passed in
        return obj
    }
    // set id
    obj[idName] = stableId(obj)
    // if original id property was passed, then set original id if not already set
    if (originalIdName && !obj[originalIdName]) {
        obj[originalIdName] = obj[idName]
    }
    // return modified object
    return obj
}