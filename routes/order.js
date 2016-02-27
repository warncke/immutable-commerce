'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var argsFromReq = require('../lib/args-from-req')
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
    var args = argsFromReq(req)
    // call controller function
    return orderController.getOrders(args)
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
    var args = argsFromReq(req)
    // call controller function
    return orderController.getOrder(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}