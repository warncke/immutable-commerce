'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var requestController = require('../controllers/request')

/* routes */

// get list of requests
router.get('/requests', getRequests)
// get a specific request
router.put('/request/:requestId', getRequest)

module.exports = router

/* route handlers */

function getRequests (req, res, next) {
    // call controller function
    requestController.getRequests(req)
    // handle success
    .then(function (data) {
        res.render('requests', data)
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

    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}