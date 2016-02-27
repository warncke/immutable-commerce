'use strict'

/* application modules */
var log = require('./log')
var instance = require('./instance')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')

/* public functions */
module.exports = requestLogger

/**
 * @function requestLogger 
 *
 * @param {object} req - express request
 * @param {object} res - express response
 * @param {function} next - callback function
 * 
 */
function requestLogger (req, res, next) {
    // post body
    var requestBodyId = stableIdWithData(req.body)
    //log data
    log.data(requestBodyId)
    // cookies
    var requestCookieId = stableIdWithData(req.cookies)
    //log data
    log.data(requestCookieId)
    // all headers as array
    var requestHeaderId = stableIdWithData(req.rawHeaders)
    //log data
    log.data(requestHeaderId)
    // get ip address
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    // query params
    var queryId = stableIdWithData(req.query)
    // log data
    log.data(queryId)
    // user agent string
    var userAgentId = stableIdWithData(req.headers['user-agent'])
    // log data
    log.data(userAgentId)
    // log user agent separately for looking up user agent strings by name
    log.userAgent(userAgentId)
    // build request data
    var requestData = {
        accountId: req.session.data.accountId,
        requestBodyId: requestBodyId.dataId,
        requestCookieId: requestCookieId.dataId,
        requestHeaderId: requestHeaderId.dataId,
        host: req.headers.host,
        instanceId: instance(),
        ipAddress: ipAddress,
        method: req.method,
        queryId: queryId.dataId,
        requestCreateTime: req.requestTimestamp,
        sessionId: req.session.data.sessionId,
        url: req.url,
        userAgentId: userAgentId.dataId,
    }
    // generate request id
    requestData.requestId = stableId(requestData)
    // store request id for logging
    req.session.requestId = req.requestId = requestData.requestId
    // set request id on response headers
    res.set('X-Request-Id', requestData.requestId)    
    // log request
    log.request(requestData)
    next()
}