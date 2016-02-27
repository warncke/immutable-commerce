'use strict'

/* applicatin libraries */
var db = require('./log-database')
var isObject = require('isobject')
var microTimestamp = require('./micro-timestamp')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')

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
    moduleCallPromise: moduleCallPromise,
    request: request,
    responseFinish: responseFinish,
    responseStart: responseStart,
    userAgent: userAgent,
    /* log retrieval functions */
    getDbResponse: getDbResponse,
    getHttpResponse: getHttpResponse,
    getModuleCallPromise: getModuleCallPromise,
    /* logging behavior flags */
    // set to false to disable all logging
    ENABLED: true,
    // set to false to disable module call logging
    LOG_CALLS: true,
    // set to false to disable database logging
    LOG_DB: true,
    // set to false to disable http logging
    LOG_HTTP: true,
}

/* logging functions */

/**
 * @function data
 *
 * @param {string} dataId - hex id of data to log
 * @param {object} data - data to log
 */
function data (args) {
    if (!log.ENABLED) {
        return
    }
    // do not insert with an undefined id
    if (!args.dataId) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO data VALUES(UNHEX(:dataId), :data)',
        args
    )
    // catch error
    .catch(log.error)
}

/**
 * @function dbConnection
 *
 * @param {string} dataId - hex id of data to log
 * @param {object} data - data to log
 */
function dbConnection (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO dbConnection VALUES(UNHEX(:dbConnectionId), UNHEX(:instanceId), UNHEX(:dbConnectionParamsId), :dbConnectionName, :dbConnectionNum, :dbConnectionCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
}

/**
 * @function dbResponse
 *
 * @param {string} dbQueryId - hex id
 * @param {string} dbResponseCreateTime
 * @param {string} dbResponseId - hex id
 */
function dbResponse (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO dbResponse VALUES(UNHEX(:dbQueryId), UNHEX(:dbResponseId), :dbResponseCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
}

/**
 * @function dbQuery
 *
 * @param {string} dbConnectionId - hex id
 * @param {string} dbQueryId - hex id
 * @param {string} dbQueryOptionsId - hex id
 * @param {string} dbQueryParamsId - hex id
 * @param {string} dbQueryCreateTime
 * @param {string} dbQueryStringId - hex id
 * @param {string} moduleCallId - hex id
 * @param {string} requestId - hex id
 */
function dbQuery (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO dbQuery VALUES(UNHEX(:dbQueryId), UNHEX(:requestId), UNHEX(:moduleCallId), UNHEX(:dbConnectionId), UNHEX(:dbQueryStringId), UNHEX(:dbQueryParamsId), UNHEX(:dbQueryOptionsId), :dbQueryCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
}

/**
 * @function error
 *
 * @param {objet} err - error object
 */
function error (err) {
    // require object
    if (!isObject(err)) {
        err = new Error(err)
    }
    // get stack id
    var errorStackId = stableIdWithData(err.stack)
    // log data
    log.data(errorStackId)
    // build error data
    var error = {
        errorCreateTime: microTimestamp(),
        errorMessage: err.message,
        errorStackId: errorStackId.dataId,
    }
    // get error id
    error.errorId = stableId(error)
    // insert data
    db('log').query(
        'INSERT DELAYED INTO error VALUES(UNHEX(:errorId), UNHEX(:errorStackId), :errorMessage, :errorCreateTime)',
        error
    )
    // catch error
    .catch(function (err) {
        // should go to disk here
        console.log(err)
    })
}

/**
 * @function httpRequest
 *
 * @param {string} httpRequestCreateTime
 * @param {string} httpRequestId - hex id
 * @param {string} httpRequestMethod
 * @param {string} httpRequestUrl
 * @param {string} httpRequestOptionsId - hex id
 * @param {string} moduleCallId - hex id
 * @param {string} requestId - hex id
 */
function httpRequest (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO httpRequest VALUES(UNHEX(:httpRequestId), UNHEX(:httpRequestOptionsId), UNHEX(:requestId), UNHEX(:moduleCallId), :httpRequestMethod, :httpRequestUrl, :httpRequestCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
}

/**
 * @function httpRequestError
 *
 * @param {string} httpRequestId - hex id
 * @param {string} httpRequestErrorId - hex id
 * @param {string} httpRequestErrorCreateTime
 */
function httpRequestError (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO httpRequestError VALUES(UNHEX(:httpRequestId), UNHEX(:httpRequestErrorId), :httpRequestErrorCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
}


/**
 * @function httpResponse
 *
 * @param {string} httpRequestId - hex id
 * @param {string} httpResponseBodyId - hex id
 * @param {string} httpResponseHeaderId - hex id
 * @param {string} httpResponseCreateTime
 * @param {string} httpResponseStatusCode
 */
function httpResponse (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO httpResponse VALUES(UNHEX(:httpRequestId), UNHEX(:httpResponseBodyId), UNHEX(:httpResponseHeaderId), :httpResponseStatusCode, :httpResponseCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
}

/**
 * @function instance
 *
 * @param {object} instance - instance data
 */
function instance (instance) {
    if (!log.ENABLED) {
        return
    }
    // insert instance record
    db('log').query(
        'INSERT DELAYED INTO instance VALUES(UNHEX(:instanceId), :hostname, :ipAddress, :port, :version, :instanceCreateTime)',
        instance
    )
    // catch error
    .catch(log.error)
}

/**
 * @function moduleCall
 *
 * @param {string} argsId - hex id
 * @param {string} functionName
 * @param {string} moduleCallCreateTime
 * @param {string} moduleCallId
 * @param {string} moduleName
 * @param {string} requestId - hex id
 * @param {string} stackId - hex id
 */
function moduleCall (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO moduleCall VALUES(UNHEX(:moduleCallId), UNHEX(:argsId), UNHEX(:requestId), UNHEX(:stackId), :functionName, :moduleName, :moduleCallCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
 }

/**
 * @function moduleCallPromise
 *
 * @param {string} moduleCallId - hex id
 * @param {integer} resolved - 0|1 indicating promise resolved or rejected
 * @param {string} returnDataId - hex id
 * @param {string} moduleCallReturnCreateTime
 */
function moduleCallPromise (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO moduleCallPromise VALUES(UNHEX(:moduleCallId), UNHEX(:promiseDataId), :resolved, :moduleCallPromiseCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
 }

/**
 * @function request
 *
 * @param {string} accountId - hex id
 * @param {string} bodyId - hex id
 * @param {string} cookieId - hex id
 * @param {string} headerId - hex id
 * @param {string} host - 
 * @param {string} instanceId - hex id
 * @param {string} ipAddress -
 * @param {string} method - 
 * @param {string} queryId - hex id
 * @param {string} requestCreateTime - 
 * @param {string} sessionId - hex id
 * @param {string} url - 
 * @param {string} userAgentId - hex id
 */
function request (args) {
    if (!log.ENABLED) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO request VALUES(UNHEX(:requestId), UNHEX(:accountId), UNHEX(:requestBodyId), UNHEX(:requestCookieId), UNHEX(:requestHeaderId), UNHEX(:instanceId), UNHEX(:queryId), UNHEX(:sessionId), UNHEX(:userAgentId), :host, :ipAddress, :method, :url, :requestCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
 }

/**
 * @function responseFinish
 *
 * @param {string} requestId - hex id
 * @param {string} responseFinishCreateTime
 */
function responseFinish (args) {
    if (!log.ENABLED) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO responseFinish VALUES(UNHEX(:requestId), :responseFinishCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
 }

 /**
 * @function responseStart
 *
 * @param {string} requestBodyId - hex id
 * @param {string} requestCookieId - hex id
 * @param {string} contentLength
 * @param {string} requestHeaderId - hex id
 * @param {string} requestId - hex id
 * @param {string} responseStartCreateTime
 * @param {string} statusCode
 */
function responseStart (args) {
    if (!log.ENABLED) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO responseStart VALUES(UNHEX(:requestId), UNHEX(:responseBodyId), UNHEX(:responseHeaderId), :contentLength, :statusCode, :responseStartCreateTime)',
        args
    )
    // catch error
    .catch(log.error)
 }

/**
 * @function userAgent
 *
 * @param {string} dataId - hex id of data to log
 * @param {string} data - user agent name string
 */
function userAgent (args) {
    if (!log.ENABLED) {
        return
    }
    // do not insert with an undefined id
    if (!args.dataId) {
        return
    }
    // insert data
    db('log').query(
        'INSERT DELAYED INTO userAgent VALUES(UNHEX(:dataId), :data)',
        args
    )
    // catch error
    .catch(log.error)
 }

 /* log retrieval functions */

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
        'SELECT d.data, mcp.resolved FROM data d JOIN moduleCallPromise mcp ON d.dataId = mcp.promiseDataId WHERE mcp.moduleCallId = UNHEX(:moduleCallId)',
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