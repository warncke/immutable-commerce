'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var immutable = require('../lib/immutable')
var orderController = require('../controllers/order')

/* routes */

// get list of orders 
router.get('/order', getOrders)
// get specific order
router.put('/order/:orderId', getOrder)

module.exports = router

/* route handlers */

function getOrders (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return orderController.getOrders(req.session)
}

function getOrder (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return orderController.getOrder(req.session)
}