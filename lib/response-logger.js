'use strict'

/* npm modules */
var onFinished = require('on-finished')

/* application modules */
var log = require('./log')
var microTimestamp = require('./micro-timestamp')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')

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
        // call original end method
        res.end(chunk, encoding)

        /* do logging */

        // body text string
        var responseBodyId = stableIdWithData(chunk.toString(encoding))
        // log data
        log.data(responseBodyId)
        // all output headers as object
        var responseHeaderId = stableIdWithData(res._headers)
        // log data
        log.data(responseHeaderId)
        // build data
        var responseStartData = {
            responseBodyId: responseBodyId.dataId,
            contentLength: res._contentLength,
            responseHeaderId: responseHeaderId.dataId,
            requestId: req.requestId,
            responseStartCreateTime: microTimestamp(),
            statusCode: res.statusCode,
        }
        // log response
        log.responseStart(responseStartData)
    }
    // make final log entry when response is finished - this does not indicate
    // that data was actually recieved by client, only that it was sent
    onFinished(res, function () {
        // build data
        var responseFinishData = {
            requestId: req.requestId,
            responseFinishCreateTime: microTimestamp(),
        }
        // log response
        log.responseFinish(responseFinishData)
    })
    next()
}