'use strict'

/* application modules */
var log = require('./log')
var instance = require('./instance')
var moment = require('moment')
var onFinished = require('on-finished')
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
        var bodyId = stableIdWithData(chunk.toString(encoding))
        // all output headers as object
        var headerId = stableIdWithData(res._headers)
        // build data
        var responseHeadersData = {
            bodyId: bodyId.dataId,
            contentLength: res._contentLength,
            headerId: headerId.dataId,
            requestId: req.requestId,
            responseStartCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
            statusCode: res.statusCode,
        }
        // all data
        log.data(bodyId)
        log.data(headerId)
        // log response
        log.responseStart(responseHeadersData)
    }
    // make final log entry when response is finished - this does not indicate
    // that data was actually recieved by client, only that it was sent
    onFinished(res, function () {
        // build data
        var responseFinishData = {
            requestId: req.requestId,
            responseFinishCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
        }
        // log response
        log.responseFinish(responseFinishData)
    })
    next()
}