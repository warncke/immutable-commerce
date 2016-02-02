'use strict'

var crypto = require('crypto')
var stringify = require('json-stable-stringify')

function stableId (data) {
    // get a JSON string of data with all keys stable sorted
    var json = stringify(data)
    // calculate hash of data
    var hash = crypto.createHash('sha256').update(json).digest("hex").toUpperCase()
    // only need 128 bits
    return hash.substring(0, 32)
}

module.exports = stableId