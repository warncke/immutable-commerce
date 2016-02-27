'use strict'

/* npm libraries */
var knex = require('knex')({client: 'mysql'});

/* application libraries */
var db = require('../lib/database.js')
var splitDateMulti = require('../../lib/split-date-multi.js')
var truncateMulti = require('../../lib/truncate-multi.js')

/* public functions */
var httpRequestModel = module.exports = {
    getHttpRequestsByRequestId: getHttpRequestsByRequestId,
}

/* private data constants */
var timeKeys = [
    'httpRequestCreateTime',
]

var idKeys = [
    'httpRequestId',
    'httpRequestOptionsId',
    'httpRequestErrorId',
    'httpResponseBodyId',
    'httpResponseHeaderId',
    'moduleCallId',
]

function getHttpRequestsByRequestId (args) {
    // build query
    var query = knex.select([
        knex.raw('HEX(httpRequest.httpRequestId) AS httpRequestId'),
        knex.raw('HEX(httpRequestOptionsId) AS httpRequestOptionsId'),
        knex.raw('HEX(requestId) AS requestId'),
        knex.raw('HEX(moduleCallId) AS moduleCallId'),
        knex.raw('HEX(httpRequestErrorId) AS httpRequestErrorId'),
        knex.raw('HEX(httpResponseBodyId) AS httpResponseBodyId'),
        knex.raw('HEX(httpResponseHeaderId) AS httpResponseHeaderId'),
        'httpRequestMethod',
        'httpRequestUrl',
        'httpResponseStatusCode',
        'httpRequestCreateTime',
        knex.raw('TIMESTAMPDIFF(MICROSECOND, httpRequestCreateTime, IF(httpRequestErrorCreateTime, httpRequestErrorCreateTime, httpResponseCreateTime)) AS requestTimeUs'),
    ])
    .from('httpRequest')
    .leftJoin('httpRequestError', 'httpRequest.httpRequestId', 'httpRequestError.httpRequestId')
    .leftJoin('httpResponse', 'httpRequest.httpRequestId', 'httpResponse.httpRequestId')
    .where('requestId', knex.raw('UNHEX(?)', args.requestId))
    .orderBy('httpRequestCreateTime')
    // query db queries
    return db('log').query(
        query.toString(),
        args
    ).then(function (res) {
        // create short versions of ids for display
        for (var i=0; i < res.length; i++) {
            // create a 'Short' version of each key 8 chars long
            truncateMulti(res[i], idKeys, 8)
            // split date-time column into date and time
            splitDateMulti(res[i], timeKeys)
        }
        return res
    })
}