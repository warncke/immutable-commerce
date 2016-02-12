'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var requestController = require('../controllers/request')
var render = require('../../lib/render')

/* routes */

// get list of requests
router.get('/requests', getRequests)
// get a specific request
router.get('/request/:requestId', getRequest)

module.exports = router

/* route handlers */

function getRequests (req, res, next) {
    // call controller function
    requestController.getRequests(req)
    // handle success
    .then(function (data) {
        render(req, res, 'requests', data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function getRequest (req, res, next) {
    // call controller function
    requestController.getRequest(req)
    // handle success
    .then(function (data) {
        render(req, res, 'request', data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}