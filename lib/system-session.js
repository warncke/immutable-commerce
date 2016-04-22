'use strict'

/* npm libraries */
var moment = require('moment')

/* application libraries */
var Session = require('./session')

/* export session instance */
var session = module.exports = new Session.Session({
    accountId: '31313131313131313131313131313131',
    requestTimestamp: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
    sessionId: '31313131313131313131313131313131',
})