'use strict'

/* npm modules */
var onFinished = require('on-finished')

/* application modules */
var log = require('./log')
var microTimestamp = require('./micro-timestamp')

/* public functions */
module.exports = responseLogger

/**
 * @function responseLogger 
 *
 * @param {object} req - express request
 * @param {object} res - express response
 * @param {function} next - callback function
 * 
 */
function responseLogger (req, res, next) {
    // capture original end method
    var resEnd = res.end
    // create our own end method that will capture the output
    res.end = function (chunk, encoding) {
        // reset original method
        res.end = resEnd
        // set request id header
        res.set('X-Request-Id', req.requestId)
        // call original end method
        res.end(chunk, encoding)
        // log response start
        log.log('responseStart', {
            body: chunk ? chunk.toString(encoding) : undefined,
            headers: res._headers,
            contentLength: res._contentLength,
            requestId: req.requestId,
            responseStartCreateTime: microTimestamp(),
            statusCode: res.statusCode,
        })
    }
    // make final log entry when response is finished - this does not indicate
    // that data was actually recieved by client, only that it was sent
    onFinished(res, function () {
        // log response - request id will always be populated now
        log.log('responseFinish', {
            requestId: req.requestId,
            responseFinishCreateTime: microTimestamp(),
        })
    })
    // go to next step
    next()
}