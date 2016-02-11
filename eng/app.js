'use strict'

/* npm modules */
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var express = require('express')
var favicon = require('serve-favicon')
var logger = require('morgan')
var moment = require('moment')
var mustacheExpress = require('mustache-express')
var path = require('path')

/* application modules */

/* routes */
var index = require('./routes/index')
var request = require('./routes/request')

/* build express app */
var app = express()

/* configure views */
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', './views');

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
app.use('/', index)
app.use('/', request)

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