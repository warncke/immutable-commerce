'use strict'

module.exports = objectType

function objectType (arg) {
    // get type 
    var type = typeof arg
    // if type is object need to disambiguate
    if (type === 'object') {
        if (Array.isArray(arg)) {
            return 'array'
        }
        else if (arg === null) {
            return 'null'
        }
        else {
            return 'object'
        }
    }
    // return type
    return type
}