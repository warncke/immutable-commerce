'use strict'

/* npm libraries */
var knex = require('knex')({client: 'mysql'});

/* application libraries */
var db = require('../lib/database.js')
var splitDateMulti = require('../../lib/split-date-multi.js')
var truncateMulti = require('../../lib/truncate-multi.js')

/* public functions */
var moduleCallModel = module.exports = {
    getModuleCallsByRequestId: getModuleCallsByRequestId,
}

/* private data constants */
var requestDateTimeKeys = [
    'moduleCallCreateTime'
]

var requestIdKeys = [
    'argsId',
    'moduleCallId',
    'promiseDataId',
    'stackId',
]

/**
 * @function getModuleCallsByRequestId
 *
 * @returns {Promise}
 */
function getModuleCallsByRequestId (args) {
    // build query
    var query = knex.select([
        knex.raw('HEX(moduleCall.moduleCallId) AS moduleCallId'),
        knex.raw('HEX(argsId) AS argsId'),
        knex.raw('HEX(requestId) AS requestId'),
        knex.raw('HEX(stackId) AS stackId'),
        knex.raw('HEX(promiseDataId) AS promiseDataId'),
        knex.raw('TIMESTAMPDIFF(MICROSECOND, moduleCallCreateTime, moduleCallPromiseCreateTime) AS runTimeUs'),
        'callNumber',
        'functionName',
        'moduleName',
        'resolved',
        'moduleCallCreateTime',
        'moduleCallPromiseCreateTime'
    ])
    .from('moduleCall')
    .leftJoin('moduleCallPromise', 'moduleCall.moduleCallId', 'moduleCallPromise.moduleCallId')
    .whereRaw('moduleCall.requestId = UNHEX(?)', [args.requestId])
    .orderBy('callNumber')
    // query calls for request
    return db('log').query(
        query.toString(),
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