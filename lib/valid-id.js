'use strict'

/* public functions */
module.exports = validId

/**
 * @function validId
 *
 * @param {array|string} ids - hex id or list of hex ids
 * @param {bool} throwError - throw error on bad id
 *
 * @returns {array|string}
 */
function validId (ids, throwError) {
    return Array.isArray(ids, throwError)
        // handle array input
        ? validIdArray(ids, throwError)
        // handle string input
        : validIdString(ids, throwError)
}

/**
 * @function validIdArray
 *
 * @param {array} ids - hex id or list of hex ids
 * @param {bool} throwError - throw error on bad id
 *
 * @returns {array}
 */
function validIdArray (ids, throwError) {
    // list of valid ids to return
    var validIds = []
    // validate all ids
    for (var i=0; i < ids.length; i++) {
        var id = ids[i]
        // validate id
        if (validIdString(id, throwError)) {
            validIds.push(id)
        }
    }
    // return valid ids
    return validIds
}

// regular expression for validating id strings
var validIdRegex = new RegExp('^[0-9A-Z]{32}$');


/**
 * @function validIdString
 *
 * @param {string} id - hex id or list of hex ids
 * @param {bool} throwError - throw error on bad id
 *
 * @returns {string}
 */
function validIdString (id, throwError) {
    // valid id
    if (typeof id === 'string' && id.match(validIdRegex)) {
        return id
    }
    // invalid id
    else {
        // throw errors if requested
        if (throwError) {
            throw new Error('invalid id '+id)
        }
        // otherwise return undefined
        else {
            return undefined
        }
    }
}