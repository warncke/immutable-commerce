'use strict'

/* application modules */
var log = require('./log')
var instance = require('./instance')
var uniqueId = require('./unique-id')

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
    // get instance data - this will always be populated by the first request
    var instanceId = instance()
    // get unique id
    var idData = uniqueId()
    // store request id
    req.session.requestId = req.requestId = idData.id
    // log request
    log.log('request', {
        accountId: req.session.accountId,
        body: req.body,
        cookies: req.cookies,
        headers: req.rawHeaders,
        host: req.headers.host,
        instanceId: instanceId,
        ipAddress: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        method: req.method,
        query: req.query,
        requestCreateTime: idData.timestamp,
        requestId: idData.id,
        sessionId: req.session.sessionId,
        userAgent: req.headers['user-agent'],
        url: req.url,
    })
    // continue
    next()
}