'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var argsFromReq = require('../lib/args-from-req')
var cartController = require('../controllers/cart')

/* routes */

// get most recent active cart for session or create new cart
router.get('/cart', getCartBySessionId)
// always create new cart
router.post('/cart', createCart)
// get specific cart by id
router.get('/cart/:cartId', getCartById)
// update cart
router.put('/cart/:cartId', updateCart)
// create order for cart
router.post('/cart/:cartId/order', createOrder)

module.exports = router

/* route handlers */

function createCart (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartController.createCart(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function createOrder (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartController.createOrder(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function getCartById (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartController.getCartById(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function getCartBySessionId (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartController.getCartBySessionId(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function updateCart (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartController.updateCart(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}