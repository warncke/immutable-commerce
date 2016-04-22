'use string'

/* public functions */
module.exports = objectReplace

function objectReplace (origObj, newObj) {
    // get keys for both objects
    origObjKeys = Object.keys(origObj)
    newObjKeys = Object.keys(newObj)
    // shared variables
    var i, key
    // delete any properties in original that are not in new
    for (i=0; i < origObjKeys.length; i++) {
        key = origObjKeys[i]
        // delete key if it is not defined in new
        if (newObj[key] === undefined) {
            delete origObj[key]
        }
    }
    // copy all properties from new to original
    for (i=0; i < newObjKeys.length; i++) {
        key = newObjKeys[i]
        // copy value
        origObj[key] = newObj[key]
    }
}