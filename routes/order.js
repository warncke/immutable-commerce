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
router.get('/order/:orderId', getOrder)

module.exports = router

/* route handlers */

function getOrders (req, res, next) {
    // call controller function
    return orderController.getOrders(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function getOrder (req, res, next) {
    // call controller function
    return orderController.getOrder(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}