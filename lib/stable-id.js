'use strict'

var crypto = require('crypto')
var stringify = require('json-stable-stringify')

function stableId (data) {
    // convert data to JSON if it is an object
    if (typeof data === 'object') {
        data = stringify(data)
    }
    // return undefined for everything other than string
    else if (typeof data !== 'string') {
        return undefined
    }
    // calculate hash of data
    var hash = crypto.createHash('sha256').update(data).digest("hex").toUpperCase()
    // only need 128 bits
    return hash.substring(0, 32)
}

module.exports = stableId