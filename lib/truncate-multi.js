'use strict'

module.exports = truncateMulti

function truncateMulti (obj, keys, length) {
    for (var i=0; i < keys.length; i++) {
        var key = keys[i]
        obj[key+'Short'] = obj[key] ? obj[key].substr(0, length) : ''
    }
}