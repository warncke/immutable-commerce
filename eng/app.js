'use strict'

/* npm modules */
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var express = require('express')
var favicon = require('serve-favicon')
var http = require('http')
var logger = require('morgan')
var moment = require('moment')
var mustacheExpress = require('mustache-express')
var path = require('path')

/* application modules */

/* routes */
var data = require('./routes/data')
var error = require('./routes/error')
var index = require('./routes/index')
var request = require('./routes/request')
var search = require('./routes/search')

/* build express app */
var app = express()

/* configure views */
app.engine('mustache', mustacheExpress())
app.set('view engine', 'mustache')
app.set('views', './views')

// log requests
app.use(logger('dev'))
// serve static files from public
app.use(express.static('public'))
// parse json
app.use(bodyParser.json())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))
// parse cookies
app.use(cookieParser())

/* set route handlers */
app.use('/', data)
app.use('/', error)
app.use('/', index)
app.use('/', request)
app.use('/', search)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

/* error handlers */

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    // log a backtrace unless this is an application level error
    if (!(err.status >= 400 && err.status < 500)) {
        console.log(err.stack)
    }
    var status = err.status || 500
    res.status(status)
    res.render('error', {
        status: status,
        message: err.message,
    })
})

module.exports = app

/* start server */

// get port from environment or use default
var port = normalizePort(process.env.PORT || '10001')
app.set('port', port)

// create HTTP server
var server = http.createServer(app)
server.on('error', onError)

// listen on provided port, on all network interfaces.
server.listen(port)

/**
 * @function normalizePort
 */
function normalizePort(val) {
    var port = parseInt(val, 10)

    if (isNaN(port)) {
        // named pipe
        return val
    }

    if (port >= 0) {
        // port number
        return port
    }

    return false
}

/**
 * @function onError
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(bind + ' is already in use')
            process.exit(1)
            break
        default:
            throw error
    }
}