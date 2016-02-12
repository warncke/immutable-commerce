'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var cartController = require('../controllers/cart')
var immutable = require('../lib/immutable')

/* routes */

// get most recent active cart for session or create new cart
router.get('/cart', getCart)
// always create new cart
router.post('/cart', createCart)
// get specific cart by id
router.get('/cart/:cartId', getCart)
// update cart
router.put('/cart/:cartId', updateCart)
// modify product quantity - returns current cart contents
router.post('/cart/:cartId/product/:productId', cartProduct)
// create order for cart
router.post('/cart/:cartId/order', createOrder)

module.exports = router

/* route handlers */

function cartProduct (req, res, next) {
    // call controller function
    return cartController.cartProduct(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function createCart (req, res, next) {
    // call controller function
    return cartController.createCart(req)
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
    // call controller function
    return cartController.createOrder(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function getCart (req, res, next) {
    // call controller function
    var promise = req.params.cartId
        ? cartController.getCartById(req)
        : cartController.getCartBySessionId(req)
    // handle response
    promise.then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function updateCart (req, res, next) {
    // call controller function
    return cartController.updateCart(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}