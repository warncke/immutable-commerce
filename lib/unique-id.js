'use strict'

/* npm modules */
var crypto = require('crypto')

/* application modules */
var microTimestamp = require('./micro-timestamp')

/* public functions */
module.exports = uniqueId

/* generate process-global seed for unique id */

// sync get 32 bytes of random data - this runs once at startup
var processId = crypto.createHash('sha256')
    // add random data to hash
    .update(crypto.randomBytes(32))
    // add microsec timestamp to hash
    .update(microTimestamp())
    // get hash as hex
    .digest("hex").toUpperCase()

// count of generated ids
var count = 0

/**
 * @function uniqueId
 *
 * @returns {object}
 */
function uniqueId () {
    // increment count of generated ids
    count++
    // get timestamp
    var timestamp = microTimestamp()
    // create unique id
    var id = crypto.createHash('sha256')
        // process id, microsec timestamp, and counter
        .update(processId + timestamp + count)
        // get hash as hex
        .digest("hex").toUpperCase()
        // only get 128 bits
        .substring(0, 32)
    // return object with id and timestamp
    return {
        id: id,
        timestamp,
    }
}