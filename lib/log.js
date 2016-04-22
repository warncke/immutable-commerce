'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var config = require('../config/log')
var instanceId = require('./instance-id')
var microTimestamp = require('./micro-timestamp')

/* public functions */
var log = module.exports = {
    /* logging functions */
    error: error,
    log: logZeroMq,
}

/* try/catch on zmq and disable logging if not available */

try {
    var zmq = require('zmq')

    var servers = [
        'tcp://127.0.0.1:9080',
    ]

    var sockets = []

    var lastSocket = 0

    /* setup zeromq */
    servers.forEach(function (connect) {
        var zmqSocket = zmq.socket('push')
        zmqSocket.connect(connect)
        zmqSocket.identify = instanceId().id
        sockets.push(zmqSocket)
    })
}
catch (ex) {
    console.log("require zmq failed - logging disabled")
    // make log a null function
    log.log = function () {}
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
    // log error
    log.log('error', {
        errorCreateTime: microTimestamp(),
        message: err.message,
        stack: err.stack,
    })
}

/**
 * @function logZeroMq
 *
 * @param {object} data
 *
 * @returns {Promise}
 */
function logZeroMq (type, data) {
    // reset socket counter when it overflows
    if (lastSocket > sockets.length - 1) {
        lastSocket = 0
    }
    // get socket
    var zmqSocket = sockets[lastSocket]
    // send log message
    zmqSocket.send(JSON.stringify({
        type: type,
        data: data,
    }))
    // use next socket
    lastSocket++
}