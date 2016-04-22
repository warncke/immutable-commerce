'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var accountOrderController = require('../controllers/account-order')
var wwwRouteHandler = require('../../lib/www-route-handler')

/* routes */

// get specific order
router.get('/account/order/:intOrderId', wwwRouteHandler({
    controllerFunction: accountOrderController.getOrder,
    requireAccount: true,
    template: 'order',
}))
// get all orders
router.get('/account/orders', wwwRouteHandler({
    controllerFunction: accountOrderController.getOrders,
    requireAccount: true,
    template: 'orders',
}))

module.exports = router