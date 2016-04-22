'use strict'

/* applicatin libraries */
var db = require('./log-database')
var isObject = require('isobject')
var microTimestamp = require('../../lib/micro-timestamp')
var stableId = require('../../lib/stable-id')
var stableIdWithData = require('../../lib/stable-id-with-data')

/* public functions */
var log = module.exports = {
    /* logging functions */
    data: data,
    dbConnection: dbConnection,
    dbQuery: dbQuery,
    dbResponse: dbResponse,
    error: error,
    httpRequest: httpRequest,
    httpRequestError: httpRequestError,
    httpResponse: httpResponse,
    instance: instance,
    moduleCall: moduleCall,
    moduleCallResolve: moduleCallResolve,
    request: request,
    responseFinish: responseFinish,
    responseStart: responseStart,
    userAgent: userAgent,
}

/* logging functions */

/**
 * @function data
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function data (data) {
    // do not insert with an undefined id
    if (!data.dataId) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO data VALUES(UNHEX(:dataId), :data)',
        data
    )
}

/**
 * @function dbConnection
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function dbConnection (data) {
    // do logging after return
    process.nextTick(function () {
        // get config data and id
        var dbConnectionParamsId = stableIdWithData(data.connectionParams)
        // build connection data
        var dbConnectionData = {
            dbConnectionId: data.connectionId,
            dbConnectionCreateTime: data.connectionCreateTime,
            dbConnectionName: data.connectionName,
            dbConnectionNum: data.connectionNum,
            dbConnectionParamsId: dbConnectionParamsId.dataId,
            instanceId: data.instanceId,
        }
        // log data
        log.data(dbConnectionParamsId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO dbConnection VALUES(UNHEX(:dbConnectionId), UNHEX(:instanceId), UNHEX(:dbConnectionParamsId), :dbConnectionName, :dbConnectionNum, :dbConnectionCreateTime)',
            dbConnectionData
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function dbResponse
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function dbResponse (data) {
    // do logging after return
    process.nextTick(function () {
        // get id
        var dbResponseId = stableIdWithData({
            data: data.data,
            info: data.info,
        })
        // log data
        log.data(dbResponseId)
        // build query data
        var dbResponseData = {
            dbResponseCreateTime: data.dbResponseCreateTime,
            dbResponseId: dbResponseId.dataId,
            dbQueryId: data.dbQueryId,
        }
        // insert data
        db('log').query(
            'INSERT DELAYED INTO dbResponse VALUES(UNHEX(:dbQueryId), UNHEX(:dbResponseId), :dbResponseCreateTime)',
            dbResponseData
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function dbQuery
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function dbQuery (data) {
    // do logging after return
    process.nextTick(function () {
        // get db query string id
        var dbQueryStringId = stableIdWithData(data.query)
        // get params id
        var dbQueryParamsId = stableIdWithData(data.params)
        // get options id
        var dbQueryOptionsId = stableIdWithData(data.options)
        // build query data
        var dbQueryData = {
            // include connection name in data used to generated unique id instead of
            // the connection id, which is instance specific
            connectionName: data.connectionName,
            dbConnectionId: data.connectionId,
            dbQueryCreateTime: data.dbQueryCreateTime,
            dbQueryId: data.dbQueryId,
            dbQueryStringId: dbQueryStringId.dataId,
            dbQueryOptionsId: dbQueryOptionsId.dataId,
            dbQueryParamsId: dbQueryParamsId.dataId,
            moduleCallId: data.moduleCallId,
            requestId: data.requestId,
        }
        // log data
        log.data(dbQueryStringId)
        log.data(dbQueryParamsId)
        log.data(dbQueryOptionsId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO dbQuery VALUES(UNHEX(:dbQueryId), UNHEX(:requestId), UNHEX(:moduleCallId), UNHEX(:dbConnectionId), UNHEX(:dbQueryStringId), UNHEX(:dbQueryParamsId), UNHEX(:dbQueryOptionsId), :dbQueryCreateTime)',
            dbQueryData
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function error
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function error (data) {
    // do logging after return
    process.nextTick(function () {
        // get stack id
        var errorStackId = stableIdWithData(data.stack)
        // log data
        log.data(errorStackId)
        // build error data
        var error = {
            errorCreateTime: data.errorCreateTime,
            errorMessage: data.message,
            errorStackId: errorStackId.dataId,
        }
        // get error id
        error.errorId = stableId(error)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO error VALUES(UNHEX(:errorId), UNHEX(:errorStackId), :errorMessage, :errorCreateTime)',
            error
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function httpRequest
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function httpRequest (data) {
    // do logging after return
    process.nextTick(function () {
        // get id
        var httpRequestOptionsId = stableIdWithData(data.options)
        // set id for logging
        data.httpRequestOptionsId = httpRequestOptionsId.dataId
        // log request options data
        log.data(httpRequestOptionsId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO httpRequest VALUES(UNHEX(:httpRequestId), UNHEX(:httpRequestOptionsId), UNHEX(:requestId), UNHEX(:moduleCallId), :httpRequestMethod, :httpRequestUrl, :httpRequestCreateTime)',
            data
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function httpRequestError
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function httpRequestError (data) {
    // do logging after return
    process.nextTick(function () {
        console.log(data)
        // get id
        var httpRequestErrorId = stableIdWithData(data.httpRequestError)
        // set id for logging
        data.httpRequestErrorId = httpRequestErrorId.dataId
        // log request options data
        log.data(httpRequestErrorId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO httpRequestError VALUES(UNHEX(:httpRequestId), UNHEX(:httpRequestErrorId), :httpRequestErrorCreateTime)',
            data
        )
    })
    // return affirmative
    return {received: true}
}


/**
 * @function httpResponse
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function httpResponse (data) {
    // do logging after return
    process.nextTick(function () {
        // get id
        var httpResponseBodyId = stableIdWithData(data.httpResponseBody)
        var httpResponseHeaderId = stableIdWithData(data.httpResponseHeader)
        // set id for logging
        data.httpResponseBodyId = httpResponseBodyId.dataId
        data.httpResponseHeaderId = httpResponseHeaderId.dataId
        // log request options data
        log.data(httpResponseBodyId)
        log.data(httpResponseHeaderId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO httpResponse VALUES(UNHEX(:httpRequestId), UNHEX(:httpResponseBodyId), UNHEX(:httpResponseHeaderId), :httpResponseStatusCode, :httpResponseCreateTime)',
            data
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function instance
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function instance (data) {
    // do logging after return
    process.nextTick(function () {
        // insert instance record
        db('log').query(
            'INSERT DELAYED INTO instance VALUES(UNHEX(:instanceId), :hostname, :ipAddress, :port, :version, :instanceCreateTime)',
            data
        )
        // capture instance id
        var instanceId = data.instanceId
        // delete instance id from data
        delete data.instanceId
        // delete time if added
        delete data.time
        // log complete instance data - redo stringify just to make sure it is correct
        log.data(stableIdWithData(data))
    })
    // return affirmative
    return {received: true}
}

/**
 * @function moduleCall
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function moduleCall (data) {
    // do logging after return
    process.nextTick(function () {
        // get args data
        var argsId = stableIdWithData(data.args)
        // set args id for logging
        data.argsId = argsId.dataId
        // log args data
        log.data(argsId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO moduleCall VALUES(UNHEX(:moduleCallId), UNHEX(:argsId), UNHEX(:requestId), UNHEX(:stackId), :functionName, :moduleName, :moduleCallCreateTime)',
            data
        )
    })
    // return affirmative
    return {received: true}
 }

/**
 * @function moduleCallResolve
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function moduleCallResolve (data) {
    // do logging after return
    process.nextTick(function () {
        // get data
        var moduleCallResolveDataId = stableIdWithData(data.moduleCallResolveData)
        // set id for logging
        data.moduleCallResolveDataId = moduleCallResolveDataId.dataId
        // log args data
        log.data(moduleCallResolveDataId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO moduleCallResolve VALUES(UNHEX(:moduleCallId), UNHEX(:moduleCallResolveDataId), :resolved, :moduleCallResolveCreateTime)',
            data
        )
    })
    // return affirmative
    return {received: true}
 }

/**
 * @function request
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function request (data) {
    // do logging after return
    process.nextTick(function () {
        // post body
        var requestBodyId = stableIdWithData(data.body)
        // cookies
        var requestCookieId = stableIdWithData(data.cookies)
        // all headers as array
        var requestHeaderId = stableIdWithData(data.headers)
        // query params
        var queryId = stableIdWithData(data.query)
        // user agent string
        var userAgentId = stableIdWithData(data.userAgent)
        // build request data
        var requestData = {
            accountId: data.accountId,
            requestBodyId: requestBodyId.dataId,
            requestCookieId: requestCookieId.dataId,
            requestHeaderId: requestHeaderId.dataId,
            host: data.host,
            instanceId: data.instanceId,
            ipAddress: data.ipAddress,
            method: data.method,
            queryId: queryId.dataId,
            requestCreateTime: data.requestCreateTime,
            requestId: data.requestId,
            sessionId: data.sessionId,
            url: data.url,
            userAgentId: userAgentId.dataId,
        }
        // log data
        log.data(requestBodyId)
        // log data
        log.data(requestCookieId)
        // log data
        log.data(requestHeaderId)
        // log data
        log.data(queryId)
        // log data
        log.data(userAgentId)
        // log user agent separately for looking up user agent strings by name
        log.userAgent(userAgentId)
        // insert data
        db('log').query(
            'INSERT DELAYED INTO request VALUES(UNHEX(:requestId), UNHEX(:accountId), UNHEX(:requestBodyId), UNHEX(:requestCookieId), UNHEX(:requestHeaderId), UNHEX(:instanceId), UNHEX(:queryId), UNHEX(:sessionId), UNHEX(:userAgentId), :host, :ipAddress, :method, :url, :requestCreateTime)',
            requestData
        )
    })
    // return affirmative
    return {received: true}
 }

/**
 * @function responseFinish
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function responseFinish (data) {
    // do logging after return
    process.nextTick(function () {
        // insert data
        db('log').query(
            'INSERT DELAYED INTO responseFinish VALUES(UNHEX(:requestId), :responseFinishCreateTime)',
            data
        )
    })
    // return affirmative
    return {received: true}
}

 /**
 * @function responseStart
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function responseStart (data) {
    // do logging after return
    process.nextTick(function () {
        // body text string
        var responseBodyId = stableIdWithData(data.body)
        // log data
        log.data(responseBodyId)
        // all output headers as object
        var responseHeaderId = stableIdWithData(data.headers)
        // log data
        log.data(responseHeaderId)
        // build data
        var responseStartData = {
            responseBodyId: responseBodyId.dataId,
            contentLength: data.contentLength,
            responseHeaderId: responseHeaderId.dataId,
            requestId: data.requestId,
            responseStartCreateTime: data.responseStartCreateTime,
            statusCode: data.statusCode,
        }
        // insert data
        db('log').query(
            'INSERT DELAYED INTO responseStart VALUES(UNHEX(:requestId), UNHEX(:responseBodyId), UNHEX(:responseHeaderId), :contentLength, :statusCode, :responseStartCreateTime)',
            responseStartData
        )
    })
    // return affirmative
    return {received: true}
}

/**
 * @function userAgent
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function userAgent (data) {
    // do not insert with an undefined id
    if (!data.dataId) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO userAgent VALUES(UNHEX(:dataId), :data)',
        data
    )
}