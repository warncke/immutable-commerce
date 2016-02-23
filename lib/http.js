'use strict'

/* npm libraries */
var isObject = require('isobject')
var rp = require('request-promise')

/* application libraries */
var log = require('./log')
var microTimestamp = require('./micro-timestamp')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')

/* public functions */
module.exports = {
    get: get,
    post: post,
    put: put,
    request: request,
}

/**
 * @function get
 *
 * @param {string} url - url to request
 * @param {object} options - options
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
 */
function request (options, session) {
    // require a url at a minimum
    if (!(isObject(options) && options.uri)) {
        return Promise.reject('uri required')
    }
    // logging enabled
    if (log.ENABLED && log.LOG_HTTP) {
        // http request log id
        var httpRequestId = logHttpRequest(options, session)
        // capture original value for full response
        var resolveWithFullResponse = options.resolveWithFullResponse
        // capture original value for "simple" mode
        var simple = options.simple
        // always resolve with full response for logging
        options.resolveWithFullResponse = true
        // set simple mode to only reject on transport and other tech
        // errors - resolve on 404 and other HTTP errors
        options.simple = false
        // make request
        return rp(options)
        // log success
        .then(function (res) {
            // log response
            logHttpResponse(httpRequestId, res)
            // response was http success
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // return only body unless full response was requested
                return resolveWithFullResponse ? res : res.body
            }
            // response was http error
            else {
                // caller overrode default value of simple=true
                if (simple === false) {
                    // resolve response even on http error
                    return resolveWithFullResponse ? res : res.body
                }
                // default simple=true
                else {
                    // reject promise with error object
                    return Promise.reject({
                        message: res.message,
                        name: 'StatusCodeError',
                        statusCode: res.statusCode,
                    })
                }
            }
        })
        // log error
        .catch(function (err) {
            console.log(err)
            // log error
            logHttpRequestError(httpRequestId, err)
            // reject promise
            return Promise.reject(err)
        })
    }
    // logging disabled
    else {
        // make request
        return rp(options)
    } 
}

/* private functions */

/**
 * @function logHttpRequest
 *
 * @param {object} options
 * @param {object} session
 */
function logHttpRequest (options, session) {
    try {
        // get options id
        var httpRequestOptionsId = stableIdWithData(options)
        // log data
        log.data(httpRequestOptionsId)
        // build http request data
        var httpRequest = {
            httpRequestCreateTime: microTimestamp(),
            httpRequestMethod: options.method,
            httpRequestUrl: options.url,
            httpRequestOptionsId: httpRequestOptionsId.dataId,
            moduleCallId: session.moduleCallId,
            requestId: session.req.requestId,
        }
        // get id
        var httpRequestId = httpRequest.httpRequestId = stableId(httpRequest)
        // log http request
        log.httpRequest(httpRequest)
        // return id for logging response
        return httpRequestId
    }
    catch (err) {
        // log error
        console.log(err)
    }
}

/**
 * @function logHttpRequestError
 *
 * @param {object} options
 * @param {object} session
 */
function logHttpRequestError (httpRequestId, err) {
    try {
        // get error message id
        var httpRequestErrorId = stableIdWithData(err.message)
        // log error data
        log.data(httpRequestErrorId)
        // build error data
        var httpRequestError = {
            httpRequestId: httpRequestId,
            httpRequestErrorCreateTime: microTimestamp(),
            httpRequestErrorId: httpRequestErrorId.dataId,
        }
        // log error
        log.httpRequestError(httpRequestError)
    }
    catch (err) {
        // log error
        console.log(err)
    }
}

/**
 * @function logHttpResponse
 *
 * @param {string} httpRequestId
 * @param {object} res - http response
 */
function logHttpResponse (httpRequestId, res) {
    try {
        // body id
        var httpResponseBodyId = stableIdWithData(res.body)
        // log body data
        log.data(httpResponseBodyId)
        // header id
        var httpResponseHeaderId = stableIdWithData(res.rawHeaders)
        // log header data
        log.data(httpResponseHeaderId)
        // build response data
        var httpResponse = {
            httpRequestId: httpRequestId,
            httpResponseBodyId: httpResponseBodyId.dataId,
            httpResponseHeaderId: httpResponseHeaderId.dataId,
            httpResponseCreateTime: microTimestamp(),
            httpResponseStatusCode: res.statusCode,
        }
        // log response
        log.httpResponse(httpResponse)
    }
    catch (err) {
        // log error
        console.log(err)
    }
}