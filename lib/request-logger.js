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
    var bodyId = stableIdWithData(req.body)
    // cookies
    var cookieId = stableIdWithData(req.cookies)
    // all headers as array
    var headerId = stableIdWithData(req.rawHeaders)
    // get ip address
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    // query params
    var queryId = stableIdWithData(req.query)
    // user agent string
    var userAgentId = stableIdWithData(req.headers['user-agent'])
    // build request data
    var requestData = {
        accountId: req.session.data.accountId,
        bodyId: bodyId.dataId,
        cookieId: cookieId.dataId,
        headerId: headerId.dataId,
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
    req.requestId = requestData.requestId
    // set request id on response headers
    res.set('X-Request-Id', requestData.requestId)
    // log all data
    log.data(bodyId)
    log.data(cookieId)
    log.data(headerId)
    log.data(queryId)
    log.data(userAgentId)
    // log user agent separately for looking up user agent strings by name
    log.userAgent(userAgentId)
    // log request
    log.request(requestData)
    next()
}