'use strict'

/* npm libraries */
var knex = require('knex')({client: 'mysql'});

/* application libraries */
var db = require('../lib/database.js')
var splitDateMulti = require('../../lib/split-date-multi.js')
var truncateMulti = require('../../lib/truncate-multi.js')

/* public functions */
var errorModel = module.exports = {
    getErrors: getErrors,
}

/* private data constants */
var dateTimeKeys = [
    'errorCreateTime'
]

var idKeys = [
    'errorId',
    'errorStackId',
]

/**
 * @function getErrors
 *
 * @param {integer} offset - starting record
 * @param {integer} limit - number of records to show
 * 
 * @returns {Promise}
 */
function getErrors (args) {
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
    // build query
    var query = knex.select([
        knex.raw('HEX(errorId) AS errorId'),
        knex.raw('HEX(errorStackId) AS errorStackId'),
        'errorMessage',
        'errorCreateTime',
    ])
    .from('error')
    .limit(args.limit)
    .offset(args.offset)
    .orderBy('errorCreateTime', 'desc')
    // query requests
    return db('log').query(
        query.toString(),
        args
    ).then(function (res) {
        // create short versions of ids for display
        for (var i=0; i < res.length; i++) {
            var record = res[i]
            // create a 'Short' version of each key 8 chars long
            truncateMulti(record, idKeys, 8)
            // split date-time column into date and time
            splitDateMulti(record, dateTimeKeys)
        }

        return res
    })
}