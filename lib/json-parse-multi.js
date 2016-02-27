'use strict'

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
    // list of keys
    if (Array.isArray(keys)) {
        for (var i=0; i < objects.length; i++) {
            var object = objects[i]
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
                        object[key] = undefined
                    }
                }
            }
        }
    }
    // single key
    else {
        for (var i=0; i < objects.length; i++) {
            var object = objects[i]
            // parse key trapping errors
            try {
                object[keys] = JSON.parse(object[keys])
            }
            // set key to undefined on parse error
            catch (err) {
                if (throwErrors) {
                    throw err
                }
                else {
                    object[key] = undefined
                }
            }
        }
    }
}