'use strict'

/* npm libraries */
var moment = require('moment')

/* application libraries */
var Session = require('./session')

/* export session instance */
var session = module.exports = new Session.Session({
    requestTimestamp: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
})

/* setup dummy values for session */

// cleanup express variables
delete session.req
delete session.res
delete session.next

// set dummy data
session.data = {
    accountId: '31313131313131313131313131313131',
    ipAddress: '0.0.0.0',
    originalSessionId: '31313131313131313131313131313131',
    sessionCreateTime: '2000-01-01 00:00:00.000000',
    sessionId: '31313131313131313131313131313131',
}
session.accountId = '31313131313131313131313131313131'
session.originalSessionId = '31313131313131313131313131313131'
session.sessionId = '31313131313131313131313131313131'