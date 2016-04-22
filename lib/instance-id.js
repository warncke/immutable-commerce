'use strict'

/* application modules */
var uniqueId = require('./unique-id')

// instance id singleton
var idData

/* public functions */
module.exports = instanceId

/**
 * @function instanceId
 *
 * @return {object}
 */
function instanceId () {
    // generate instance id if it does not exist
    if (!idData) {
        idData = uniqueId()
    }
    // return instance id
    return idData
}