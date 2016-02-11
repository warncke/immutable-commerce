'use strict'

/* npm libraries */

/* application libraries */
var db = require('../lib/database.js')
var splitDateMulti = require('../../lib/split-date-multi.js')
var truncateMulti = require('../../lib/truncate-multi.js')

/* public functions */
var requestModel = module.exports = {
    getRequestById: getRequestById,
    getRequests: getRequests,
}

/* private data constants */
var requestDateTimeKeys = [
    'requestCreateTime'
]

var requestIdKeys = [
    'accountId',
    'bodyId',
    'cookieId',
    'headerId',
    'instanceId',
    'queryId',
    'requestId',
    'sessionId'
]

/**
 * @function getRequestsById
 *
 * @param {string} requestId - hex id of original cart
 * 
 * @returns {Promise}
 */
function getRequestById (args) {

}

/**
 * @function getRequests
 *
 * @param {integer} offset - starting record
 * @param {integer} limit - number of records to show
 * 
 * @returns {Promise}
 */
function getRequests (args) {
    // require args to be object
    if (typeof args !== 'object') {
        args = {}
    }
    // default offset to 0
    if (!args.offset) {
        args.offset = 0
    }
    // default limit to 1000
    if (!args.limit) {
        args.limit = 1000
    }
    // query requests
    return db('log').query(
        'SELECT * FROM request_hex ORDER BY requestCreateTime DESC LIMIT 0, 100',
        args
    ).then(function (res) {
        // create short versions of ids for display
        for (var i=0; i < res.length; i++) {
            // create a 'Short' version of each key 8 chars long
            truncateMulti(res[i], requestIdKeys, 8)
            // split date-time column into date and time
            splitDateMulti(res[i], requestDateTimeKeys)
        }

        return res
    })
}