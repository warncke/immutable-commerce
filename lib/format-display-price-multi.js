'use strict'

module.exports = formatDisplayPriceMulti

function formatDisplayPriceMulti (obj, keys) {
    // if keys is not set then format all properties of object
    if (!Array.isArray(keys)) {
        keys = Object.keys(obj)
    }
    // format all requested keys for display - input is integer in
    // cents and output is dollars
    for (var i=0; i < keys.length; i++) {
        var key = keys[i]
        // skip values that are not numbers
        if (typeof obj[key] !== 'number') {
            continue
        }
        // origKey => displayOrigKey
        var displayKey = 'display' + key.charAt(0).toUpperCase() + key.slice(1)
        // format value
        obj[displayKey] = (obj[key] / 100).toFixed(2)
    }
}