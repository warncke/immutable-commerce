'use strict'

var db = require('../lib/log-database')

/* public functions */
var log = module.exports = {
    data: data,
    dbConnection: dbConnection,
    dbQueryFinish: dbQueryFinish,
    dbQueryStart: dbQueryStart,
    instance: instance,
    moduleCall: moduleCall,
    moduleCallPromise: moduleCallPromise,
    request: request,
    responseFinish: responseFinish,
    responseStart: responseStart,
    userAgent: userAgent,
    // set to false to disable all logging
    ENABLED: false,
    // set to false to disable module call logging
    LOG_CALLS: true,
    // set to false to disable database logging
    LOG_DB: true,
}

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
    .catch(function (err) {
        console.log(err)
    })
}

/**
 * @function dbQueryFinish
 *
 * @param {string} dbQueryFinishCreateTime
 * @param {string} dbQueryResponseId - hex id
 * @param {string} dbQueryStartId - hex id
 */
 function dbQueryFinish (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO dbQueryFinish VALUES(UNHEX(:dbQueryStartId), UNHEX(:dbQueryResponseId), :dbQueryFinishCreateTime)',
        args
    )
    // catch error
    .catch(function (err) {
        console.log(err)
    })
}

/**
 * @function dbQueryStart
 *
 * @param {string} dbConnectionId - hex id
 * @param {string} dbQueryId - hex id
 * @param {string} dbQueryOptionsId - hex id
 * @param {string} dbQueryParamsId - hex id
 * @param {string} dbQueryStartCreateTime
 * @param {string} dbQueryStartId - hex id
 * @param {string} moduleCallId - hex id
 * @param {string} requestId - hex id
 */
 function dbQueryStart (args) {
    // insert data
    db('log').query(
        'INSERT DELAYED INTO dbQueryStart VALUES(UNHEX(:dbQueryStartId), UNHEX(:requestId), UNHEX(:moduleCallId), UNHEX(:dbConnectionId), UNHEX(:dbQueryId), UNHEX(:dbQueryParamsId), UNHEX(:dbQueryOptionsId), :dbQueryStartCreateTime)',
        args
    )
    // catch error
    .catch(function (err) {
        console.log(err)
    })
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
}

/**
 * @function moduleCall
 *
 * @param {string} argsId - hex id
 * @param {string} callNumber
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
        'INSERT DELAYED INTO moduleCall VALUES(UNHEX(:moduleCallId), UNHEX(:argsId), UNHEX(:requestId), UNHEX(:stackId), :callNumber, :functionName, :moduleName, :moduleCallCreateTime)',
        args
    )
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
    ).catch(function (err) {
        console.log(err)
    })
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
 }