'use strict'

/* npm modules */
var isObject = require('isobject')

/* public functions */
module.exports = jsonParseMulti

/**
 * jsonParseMulti
 *
 * @param {array} objects - list of objects to parse JSON in
 * @param {array|string} keys - key(s) to parse
 * @param {bool} throwErrors - throw errors, default false
 */
function jsonParseMulti (objects, keys, throwErrors) {
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
            // parse key trapping errors
            try {
                object[key] = JSON.parse(object[key])
            }
            // set key to undefined on parse error
            catch (err) {
                if (throwErrors) {
                    throw err
                }
                else {
                    object[key] = {}
                }
            }
        }
    }
    // return either array or single object depending on input
    return objectsIsArray ? objects : objects[0]
}