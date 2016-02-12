'use strict'

/* npm libraries */
var knex = require('knex')({client: 'mysql'});

/* application libraries */
var db = require('../lib/database.js')
var splitDateMulti = require('../../lib/split-date-multi.js')
var truncateMulti = require('../../lib/truncate-multi.js')

/* public functions */
var dbQueryModel = module.exports = {
    getDbQueriesByRequestId: getDbQueriesByRequestId,
}

/* private data constants */
var dbQueryTimeKeys = [
    'dbQueryStartCreateTime',
    'dbQueryFinishCreateTime',
]

var dbQueryIdKeys = [
    'dbConnectionId',
    'dbQueryId',
    'dbQueryParamsId',
    'dbQueryOptionsId',
    'dbQueryResponseId',
    'moduleCallId',
]

function getDbQueriesByRequestId (args) {
    // build query
    var query = knex.select([
        knex.raw('HEX(dbQueryStart.dbQueryStartId) AS dbQueryStartId'),
        knex.raw('HEX(requestId) AS requestId'),
        knex.raw('HEX(moduleCallId) AS moduleCallId'),
        knex.raw('HEX(dbConnectionId) AS dbConnectionId'),
        knex.raw('HEX(dbQueryId) AS dbQueryId'),
        knex.raw('HEX(dbQueryParamsId) AS dbQueryParamsId'),
        knex.raw('HEX(dbQueryOptionsId) AS dbQueryOptionsId'),
        knex.raw('HEX(dbQueryResponseId) AS dbQueryResponseId'),
        'dbQueryStartCreateTime',
        'dbQueryFinishCreateTime',
        knex.raw('TIMESTAMPDIFF(MICROSECOND, dbQueryStartCreateTime, dbQueryFinishCreateTime) AS queryTimeUs'),
    ])
    .from('dbQueryStart')
    .leftJoin('dbQueryFinish', 'dbQueryStart.dbQueryStartId', 'dbQueryFinish.dbQueryStartId')
    .where('requestId', knex.raw('UNHEX(?)', args.requestId))
    .orderBy('dbQueryStartCreateTime')
    console.log(query.toString())
    // query db queries
    return db('log').query(
        query.toString(),
        args
    ).then(function (res) {
        // create short versions of ids for display
        for (var i=0; i < res.length; i++) {
            // create a 'Short' version of each key 8 chars long
            truncateMulti(res[i], dbQueryIdKeys, 8)
            // split date-time column into date and time
            splitDateMulti(res[i], dbQueryTimeKeys)
        }
        return res
    })
}