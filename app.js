'use strict'

/* npm modules */
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var cors = require('cors')
var express = require('express')
// var favicon = require('serve-favicon')
var http = require('http')
var logger = require('morgan')
var colors = require('colors')
// var moment = require('moment')
// var path = require('path')

/* application modules */
var instance = require('./lib/instance')
var log = require('./lib/log')
var microTimestamp = require('./lib/micro-timestamp')
var packageJson = require('./lib/package-json')
var requestLogger = require('./lib/request-logger')
var responseLogger = require('./lib/response-logger')
var session = require('./lib/session')

/* routes */
var address = require('./routes/address')
var cart = require('./routes/cart')
var cartProduct = require('./routes/cart-product')
var discount = require('./routes/discount')
var eventRoutes = require('./routes/event')
var favorite = require('./routes/favorite')
var index = require('./routes/index')
var mealPlan = require('./routes/meal-plan')
var mealPlanOffer = require('./routes/meal-plan-offer')
var order = require('./routes/order')
var paymentMethod = require('./routes/payment-method')
var product = require('./routes/product')
var productOption = require('./routes/product-option')
var rpc = require('./routes/rpc')

/* load all controllers */
require('require-all')({
    dirname: __dirname + '/controllers',
    excludeDirs: /^\./,
    filter: /js$/,
    recursive: true,
})

/* load all www controllers */
require('require-all')({
    dirname: __dirname + '/www/controllers',
    excludeDirs: /^\./,
    filter: /js$/,
    recursive: true,
})

/* load all models */
require('require-all')({
    dirname: __dirname + '/models',
    excludeDirs: /^\./,
    filter: /js$/,
    recursive: true,
})

/* load extensions */
require('require-all')({
    dirname: __dirname + '/extensions',
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

app.use(logger('[:date[iso]] [HTTP]  :remote-addr - ":method :url HTTP/:http-version" :color-status :res[content-length] - :response-time ms'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())

// enable cors for eng console - work on this
app.use(
    cors({
        origin: 'http://marketplacenc.dev:3001'
    })
)

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

// set route handlers
app.use('/', address)
app.use('/', cart)
app.use('/', cartProduct)
app.use('/', discount)
app.use('/', eventRoutes)
app.use('/', favorite)
app.use('/', index)
app.use('/', mealPlan)
app.use('/', mealPlanOffer)
app.use('/', order)
app.use('/', paymentMethod)
app.use('/', product)
app.use('/', productOption)
app.use('/', rpc)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

/* error handlers */

app.use(function(err, req, res, next) {
    // log a backtrace unless this is an application level error
    if (!(err.status >= 400 && err.status < 500)) {
        log.error(err)
        console.log(err.stack)
    }
    res.status(err.status || 500)
    // build response data
    var resData
    // send data for 409 Conflict errors
    if (err.status === 409) {
        resData = err.data
    }
    // send error message with optional data
    else {
        // set error message
        resData = {
            error: err.message
        }
        // if error has data attached copy it to response
        if (err.data) {
            var keys = Object.keys(err.data)
            // copy data
            for (var i=0; i < keys.length; i++) {
                var key = keys[i]
                resData[key] = err.data[key]
            }
        }
    }
    // add app version to response
    resData.appVersion = packageJson.version
    // send error response
    res.send(resData)
})

module.exports = app

/* start server */

// get port from environment or use default
var port = normalizePort(process.env.PORT || '9077')
app.set('port', port)

// create HTTP server
var server = http.createServer(app)
server.on('error', onError)

// listen on provided port, on all network interfaces.
server.listen(port, function () {
    console.log('Immutable Commerce server listening on port ' + port)
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
