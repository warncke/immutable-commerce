'use strict'

/* npm libraries */
var knex = require('knex')({client: 'mysql'});

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
    'instanceId',
    'queryId',
    'requestBodyId',
    'requestCookieId',
    'requestHeaderId',
    'requestId',
    'responseBodyId',
    'responseHeaderId',
    'sessionId',
]

var whereParams = [
    'ipAddress',
    'url',
]

/**
 * @function getRequestsById
 *
 * @param {string} requestId - hex id of request
 * 
 * @returns {Promise}
 */
function getRequestById (args) {
    return getRequests(args).then(function (res) {
        // not found
        if (!res.length) {
            return
        }
        // create a 'Short' version of each key 8 chars long
        truncateMulti(res[0], requestIdKeys, 8)
        // split date-time column into date and time
        splitDateMulti(res[0], requestDateTimeKeys)

        return res[0]
    })
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
    // build query
    var query = knex.select([
        knex.raw('HEX(request.requestId) AS requestId'),
        knex.raw('HEX(accountId) AS accountId'),
        knex.raw('HEX(requestBodyId) AS requestBodyId'),
        knex.raw('HEX(requestCookieId) AS requestCookieId'),
        knex.raw('HEX(requestHeaderId) AS requestHeaderId'),
        knex.raw('HEX(instanceId) AS instanceId'),
        knex.raw('HEX(queryId) AS queryId'),
        knex.raw('HEX(sessionId) AS sessionId'),
        knex.raw('HEX(userAgentId) AS userAgentId'),
        knex.raw('HEX(responseBodyId) AS responseBodyId'),
        knex.raw('HEX(responseHeaderId) AS responseHeaderId'),
        'contentLength',
        'host',
        'ipAddress',
        'method',
        'url',
        'requestCreateTime',
        'responseStartCreateTime',
        'responseFinishCreateTime',
        'statusCode',
        knex.raw('ROUND(TIMESTAMPDIFF(MICROSECOND, requestCreateTime, responseStartCreateTime) / 1000) AS serverTimeMs'),
        knex.raw('ROUND(TIMESTAMPDIFF(MICROSECOND, responseStartCreateTime, responseFinishCreateTime) / 1000) AS networkTimeMs'),
    ])
    .from('request')
    .leftJoin('responseStart', 'request.requestId', 'responseStart.requestId')
    .leftJoin('responseFinish', 'request.requestId', 'responseFinish.requestId')
    .limit(args.limit)
    .offset(args.offset)
    .orderBy('requestCreateTime', 'desc')
    // loop counter
    var i
    // add optional where clauses using hex id strings
    for (i=0; i < requestIdKeys.length; i++) {
        var whereParam = requestIdKeys[i]
        // if where param value was passed then query by it
        if (args[whereParam]) {
            // request id must be qualified
            if (whereParam === 'requestId') {
                query.where('request.requestId', knex.raw('UNHEX(?)', args[whereParam]))
            }
            else {
                query.where(whereParam, knex.raw('UNHEX(?)', args[whereParam]))
            }
        }
    }
    // add optional where clauses using strings
    for (i=0; i < whereParams.length; i++) {
        var whereParam = whereParams[i]
        // if where param value was passed then query by it
        if (args[whereParam]) {
            query.where(whereParam, args[whereParam])
        }
    }
    // query requests
    return db('log').query(
        query.toString(),
        args
    ).then(function (res) {
        // create short versions of ids for display
        for (var i=0; i < res.length; i++) {
            var record = res[i]
            // create a 'Short' version of each key 8 chars long
            truncateMulti(record, requestIdKeys, 8)
            // create a 'Short' version or url
            truncateMulti(record, ['url'], 80)
            console.log(record)
            // split date-time column into date and time
            splitDateMulti(record, requestDateTimeKeys)
            // set a color for status code
            if (record.statusCode === '200') {
                record.statusColor = 'green'
            }
            else if (record.statusCode >= 400 && record.statusCode < 500) {
                record.statusColor = 'orange'
            }
            else if (record.statusCode >= 500) {
                record.statusColor = 'red'
            }
            else {
                record.statusColor = 'black'
            }
        }

        return res
    })
}