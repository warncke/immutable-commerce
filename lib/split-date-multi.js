'use strict'

module.exports = splitDateMulti

function splitDateMulti (obj, keys) {
    for (var i=0; i < keys.length; i++) {
        var key = keys[i]
        var dateTime = obj[key]
        // require string
        if (typeof dateTime !== 'string') {
            obj[key+'Date'] = ''
            obj[key+'Time'] = ''
        }
        // split into date and time
        var parts = dateTime.split(' ', 2)
        // store date and time as separate components
        obj[key+'Date'] = parts[0] ? parts[0] : ''
        obj[key+'Time'] = parts[1] ? parts[1] : ''
    }
}