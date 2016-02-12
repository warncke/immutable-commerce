'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var notFound = require('../../lib/not-found')

/* routes */

// get list of requests
router.post('/search', search)

module.exports = router

/* private variables */
var requestsParams = {
    accountId: true,
    ipAddress: true,
    sessionId: true,
    url: true,
}

/* route handlers */

function search (req, res, next) {
    // redirect to request page for request id
    if (req.body.searchType === 'requestId') {
        res.redirect('/request/'+req.body.query)
    }
    // redirect to data page for data id
    else if (req.body.searchType === 'dataId') {
        res.redirect('/data/'+req.body.query)
    }
    // redirect to filtered requests with valid param
    else if (requestsParams[req.body.searchType]) {
        res.redirect('/requests/?'+req.body.searchType+'='+req.body.query)
    }
    // redirect to home on bad params
    else {
        res.redirect('/')
    }
}