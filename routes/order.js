'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var orderController = require('../controllers/order')

/* routes */

// get list of orders 
router.get('/order', apiRouteHandler(orderController.getOrders))
// get specific order
router.get('/order/:orderId', apiRouteHandler(orderController.getOrder))
// cancel order
router.post('/order/:orderId/cancel', apiRouteHandler(orderController.cancelOrder))

module.exports = router