'use strict'

/* npm libraries */
var isObject = require('isobject')
var rp = require('request-promise')

/* application libraries */
var log = require('./log')
var microTimestamp = require('./micro-timestamp')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')
var uniqueId = require('./unique-id')

/* public functions */
module.exports = {
    delete: httpDelete,
    get: get,
    post: post,
    put: put,
    request: request,
}

/**
 * @function httpDelete
 *
 * @param {string} url - url to request
 * @param {object} body - post body
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function httpDelete (url, body, options, session) {
    // require option to be object
    if (!isObject(options)) {
        options = {}
    }
    // set http method
    options.method = 'DELETE'
    // merge arguments into options
    options.body = body
    options.uri = url
    // make request
    return request(options, session)
}

/**
 * @function get
 *
 * @param {string} url - url to request
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function get (url, options, session) {
    // require option to be object
    if (!isObject(options)) {
        options = {}
    }
    // set http method
    options.method = 'GET'
    // merge arguments into options
    options.uri = url
    // make request
    return request(options, session)
}

/**
 * @function post
 *
 * @param {string} url - url to request
 * @param {object} body - post body
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function post (url, body, options, session) {
    // require option to be object
    if (!isObject(options)) {
        options = {}
    }
    // set http method
    options.method = 'POST'
    // merge arguments into options
    options.body = body
    options.uri = url
    // make request
    return request(options, session)
}

/**
 * @function put
 *
 * @param {string} url - url to request
 * @param {object} body - post body
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function put (url, body, options, session) {
    // require option to be object
    if (!isObject(options)) {
        options = {}
    }
    // set http method
    options.method = 'PUT'
    // merge arguments into options
    options.body = body
    options.uri = url
    // make request
    return request(options, session)
}

/**
 * @function request
 *
 * @param {object} options
 * @param {object} session
 *
 * @returns {Promise}
 */
function request (options, session) {
    // capture module call
    var moduleCallId = session && session.moduleCallId
    // require a url at a minimum
    if (!(isObject(options) && options.uri)) {
        return Promise.reject('uri required')
    }
    // if running in replay mode then returned previously logged response
    if (session.replay) {
        /* FIX THIS !!!
        // get request id without logging
        var httpRequestId = getHttpRequestId(options, session)
        // get http response from log
        return log.getHttpResponse({
            httpRequestId: httpRequestId,
        })
        */
    }
    // get request id
    var idData = uniqueId()
    // http request log id
    logHttpRequest(idData, options, session)
    // always resolve with full response for logging
    options.resolveWithFullResponse = true
    // set simple mode to only reject on transport and other tech
    // errors - resolve on 404 and other HTTP errors
    options.simple = false
    // make request
    return rp(options)
    // log success
    .then(function (res) {
        // remove all non-critical data from response
        res = cleanRes(res)
        // log response
        logHttpResponse(idData, res)
        // return modified response
        return res
    })
    // log error
    .catch(function (err) {
        // log error
        logHttpRequestError(idData, err)
        // reject promise
        return Promise.reject(err)
    })
}

/* private functions */

/**
 * @function cleanRes
 *
 * @param {object} res - http response
 *
 * @returns (object)
 */
function cleanRes (res) {
    return {
        body: res.body,
        rawHeaders: res.rawHeaders,
        statusCode: res.statusCode,
    }
}

/**
 * @function logHttpRequest
 *
 * @param {object} idData
 * @param {object} options
 * @param {object} session
 *
 * @returns {string}
 */
function logHttpRequest (idData, options, session, moduleCallId) {
    // get module call and request id
    var moduleCallId = session && session.moduleCallId
    var requestId = session && session.requestId
    // log request
    log.log('httpRequest', {
        httpRequestCreateTime: idData.timestamp,
        httpRequestId: idData.id,
        options: options,
        moduleCallId: moduleCallId,
        requestId: requestId,
    })
}

/**
 * @function logHttpRequestError
 *
 * @param {object} idData
 * @param {object} err
 */
function logHttpRequestError (idData, err) {
    // log error
    log.log('httpRequestError', {
        httpRequestId: idData.id,
        httpRequestErrorCreateTime: microTimestamp(),
        httpRequestError: err.message,
    })
}

/**
 * @function logHttpResponse
 *
 * @param {object} idData
 * @param {object} res - http response
 */
function logHttpResponse (idData, res) {
    // log response
    log.log('httpResponse', {
        httpRequestId: idData.id,
        httpResponseBody: res.body,
        httpResponseHeader: res.rawHeaders,
        httpResponseCreateTime: microTimestamp(),
        httpResponseStatusCode: res.statusCode,

    })
}