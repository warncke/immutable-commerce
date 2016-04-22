'use strict'

/* npm modules */
var zmq = require('zmq')

/* application modules */
var instanceId = require('../lib/instance-id')
var log = require('./lib/log')

/* setup zeromq sub */

var port = process.env.PORT || '9080'
var bind = 'tcp://127.0.0.1:'+port

var zmqSocket = zmq.socket('pull')

zmqSocket.bindSync(bind)
console.log('listening on '+bind)

zmqSocket.identify = instanceId().id

zmqSocket.on('message', function (message) {
    try {
        message = JSON.parse(message.toString())
        // get input
        var data = message.data
        var type = message.type
        // get log method
        var logMethod = log[type]
        // require valid log method
        if (logMethod) {
            // send response
            logMethod(data)
        }
        else {
            console.log('invalid type: '+type)
        }
    }
    catch (ex) {
        console.log(ex)
    }
})