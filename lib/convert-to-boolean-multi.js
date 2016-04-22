'use strict'

/* npm modules */
var isObject = require('isobject')

/* public functions */
module.exports = convertToBooleanMulti

/**
 * convertToBooleanMulti
 *
 * @param {array|object} objects - list of objects to convert keys to boolean
 * @param {array|string} keys - key(s) to parse
 * @param {bool} throwErrors - throw errors, default false
 */
function convertToBooleanMulti (objects, keys) {
    // make sure keys is always array
    if (!Array.isArray(keys)) {
        keys = [keys]
    }
    // capture original input type
    var objectsIsArray = Array.isArray(objects)
    // make sure objects is array
    if (!objectsIsArray) {
        objects = [objects]
    }
    // iterate over all objects
    for (var i=0; i < objects.length; i++) {
        var object = objects[i]
        // skip values that are not objects
        if (!isObject(object)) {
            continue
        }
        // parse all keys
        for (var j=0; j < keys.length; j++) {
            var key = keys[j]
            var val = object[key]
            // convert '1' to true
            if (object[key] === '1') {
                object[key] = true
            }
            // covert '0' to false
            else if (object[key] === '0') {
                object[key] = false
            }
            // otherwise do boolean evaluation
            else {
                return object[key] ? true : false
            }
        }
    }
    // return either array or single object depending on input
    return objectsIsArray ? objects : objects[0]
}