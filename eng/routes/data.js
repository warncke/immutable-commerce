'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var dataController = require('../controllers/data')
var render = require('../../lib/render')

/* routes */

// get a data item
router.get('/data/:dataId', getData)

module.exports = router

/* route handlers */

function getData (req, res, next) {
    // call controller function
    dataController.getData(req)
    // handle success
    .then(function (data) {
        // render
        render(req, res, 'data', data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}