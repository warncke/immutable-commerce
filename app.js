'use strict'

/* npm modules */
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var express = require('express')
var favicon = require('serve-favicon')
var logger = require('morgan')
var moment = require('moment')
var path = require('path')

/* application modules */
var session = require('./models/session')

/* routes */
var cart = require('./routes/cart')
var index = require('./routes/index')
var order = require('./routes/order')

/* build express app */
var app = express()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())

// capture and optionally set the start time of the program execution 
// all queries are executed within the boundaries set by this time
app.use(function (req, res, next) {
    req.requestMoment = moment()
    req.requestTimestamp = req.requestMoment.format('YYYY-MM-DD HH:mm:ss.SSSSSS')
    next()
})

// perform authentication and session management
app.use(session.auth)

// set route handlers
app.use('/', cart)
app.use('/', index)
app.use('/', order)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

/* error handlers */

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500)
        res.send({
            message: err.message,
            error: err,
        })
    })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    // log a backtrace unless this is an application level error
    if (!(err.status >= 400 && err.status < 500)) {
        console.log(err.stack)
    }
    res.status(err.status || 500)
    res.send({
        message: err.message,
        error: {},
    })
})

module.exports = app