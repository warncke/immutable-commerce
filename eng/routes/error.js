'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var errorController = require('../controllers/error')
var render = require('../../lib/render')

/* routes */

// get list of recent errors
router.get('/errors', getErrors)

module.exports = router

/* route handlers */

function getErrors (req, res, next) {
    // call controller function
    errorController.getErrors(req)
    // handle success
    .then(function (data) {
        render(req, res, 'errors', data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}