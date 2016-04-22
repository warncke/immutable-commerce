'use strict'

/* application libraries */
var db = require('../lib/database.js')

/* public functions */

// this is a unique model which is used specifically for
// the purpose of reitreiving previously logged data and
// as such does not use the typical module infrastructure
module.exports = {
    getDbResponse: getDbResponse,
    getHttpResponse: getHttpResponse,
    getModuleCallPromise: getModuleCallPromise,
}

/**
 * @function getDbResponse
 *
 * @param {string} dbQueryId - hex id of db query
 */
function getDbResponse (args) {
    return db('logEng').query(
        'SELECT d.data FROM data d JOIN dbResponse dbr ON d.dataId = dbr.dbResponseId WHERE dbr.dbQueryId = UNHEX(:dbQueryId)',
        args
    ).then(function (res) {
        // if id was not found throw an error on request
        if (!res.length) {
            throw new Error('dbQueryId not found '+args.dbQueryId)
        }
        // parse logged response data
        var loggedRes = JSON.parse(res[0].data)
        // rebuild res as array with named properties
        res = loggedRes.data
        res.info = loggedRes.info
        // return rebuilt response array/object that matches original
        return res
    })
    .catch(log.error)
}

/**
 * @function getHttpResponse
 *
 * @param {string} httpRequestId - hex id of http request
 */
function getHttpResponse (args) {
    return db('logEng').query(
        'SELECT d1.data AS rawHeaders, d2.data AS body, hr.httpResponseStatusCode AS statusCode FROM httpResponse hr JOIN data d1 ON hr.httpResponseHeaderId = d1.dataId JOIN data d2 ON hr.httpResponseBodyId = d2.dataId WHERE hr.httpRequestId = UNHEX(:httpRequestId)',
        args
    ).then(function (res) {
        // if id was not found throw an error on request
        if (!res.length) {
            throw new Error('httpRequestId not found '+args.httpRequestId)
        }
        // get record
        var rec = res[0]
        // rebuild original response
        return {
            body: rec.body,
            rawHeaders: JSON.parse(rec.rawHeaders),
            statusCode: parseInt(rec.statusCode),
        }
    })
    .catch(log.error)
 }

 /**
 * @function getModuleCallPromise
 *
 * @param {string} moduleCallId - hex id of module call
 */
function getModuleCallPromise (args) {
    return db('logEng').query(
        'SELECT d.data, mcp.resolved FROM data d JOIN moduleCallResolve mcp ON d.dataId = mcp.moduleCallResolveDataId WHERE mcp.moduleCallId = UNHEX(:moduleCallId)',
        args
    ).then(function (res) {
        // if id was not found throw an error on request
        if (!res.length) {
            throw new Error('moduleCallId not found '+args.moduleCallId)
        }
        // parse logged response data
        var ret = JSON.parse(res[0].data)
        // either resolve or reject promise to match original action
        return res[0].resolved ? Promise.resolve(ret) : Promise.reject(ret)
    })
    .catch(log.error)
 }