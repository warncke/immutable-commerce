'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var discountController = require('../controllers/discount')

/* routes */

// use code to unlock discount for current session
router.post('/discount', apiRouteHandler(discountController.createSessionDiscount))
// get the currently active discount, if any, for session
router.delete('/discount', apiRouteHandler(discountController.deleteSessionDiscount))
// get the currently active discount, if any, for session
router.get('/discount', apiRouteHandler(discountController.getSessionDiscount))

module.exports = router