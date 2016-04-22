'use strict'

/* npm modules */
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var express = require('express')
var favicon = require('serve-favicon')
var http = require('http')
var logger = require('morgan')
var colors = require('colors')
var moment = require('moment')
var mustacheExpress = require('mustache-express')
var path = require('path')

/* application modules */
var instance = require('../lib/instance')
var log = require('../lib/log')
var microTimestamp = require('../lib/micro-timestamp')
var requestLogger = require('../lib/request-logger')
var responseLogger = require('../lib/response-logger')
var session = require('../lib/session')

/* routes */
var account = require('./routes/account')
var checkout = require('./routes/checkout')

/* load extensions */
require('require-all')({
    dirname: __dirname + '/../extensions',
    excludeDirs: /^\./,
    filter: /js$/,
    recursive: true,
})

/* configure logger */
require("console-stamp")(console, { pattern : "UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'" });
if (!process.env.DisableConsoleColors) {
    colors.enabled = true;
}
logger.token('color-status', function (req, res) {
    var status = res.statusCode;

    if (status >= 500) {
        return colors.red(status)
    }
    if (status >= 400) {
        return colors.yellow(status)
    }
    if (status >= 300) {
        return colors.cyan(status)
    }

    return colors.green(status);
});

/* build express app */
var app = express()

/* configure views */
app.engine('mustache', mustacheExpress())
app.set('view engine', 'mustache')
app.set('views', './views')

// log requests
app.use(logger('[:date[iso]] [HTTP]  :remote-addr - ":method :url HTTP/:http-version" :color-status :res[content-length] - :response-time ms'))

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

// capture and optionally set the start time of the program execution
// all queries are executed within the boundaries set by this time
app.use(function (req, res, next) {
    req.requestTimestamp = microTimestamp()
    next()
})

// perform authentication and session management
app.use(session.auth)

// do internal logging of requests
app.use(requestLogger)
app.use(responseLogger)

/* set route handlers */
app.use('/', account)
app.use('/', checkout)
app.use('/', webappBootstrap)

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
    // check for redirects
    if (err.status === 301 || err.status === 302) {
        return res.redirect(err.status, err.url)
    }
    // log a backtrace unless this is an application level error
    if (!(err.status >= 400 && err.status < 500)) {
        console.log(err.stack)
        log.error(err, req.session)
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
var port = normalizePort(process.env.PORT || '9078')
app.set('port', port)

// create HTTP server
var server = http.createServer(app)
server.on('error', onError)

// listen on provided port, on all network interfaces.
server.listen(port, function () {
    console.log('Immutable Commerce WWW server listening on port ' + port)
})

// initialize new instance
instance({
    ipAddress: server.address().address,
    ipVersion: server.address().family,
    port: server.address().port,
})


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
