'use strict'

/* npm libraries */

var express = require('express')
var router = express.Router()

/* application libraries */

var OrderController = require('../controllers/order')

// get list of orders 
router.get('/order', getOrders)
// get specific order
router.put('/order/:orderId', getOrder)

module.exports = router

/* route handlers */

function getOrders (req, res, next) {
    var orderController = new OrderController(req, res, next)

    return orderController.getOrders()
}

function getOrder (req, res, next) {
    var orderController = new OrderController(req, res, next)

    return orderController.getOrder()
}