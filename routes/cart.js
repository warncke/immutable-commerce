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
    // set next callback for current context
    req.session.next = next
    // call controller function
    return cartController.cartProduct(req.session)
}

function createCart (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return cartController.createCart(req.session)
}

function createOrder (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return cartController.createOrder(req.session)
}

function getCart (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return req.params.cartId
        ? cartController.getCartById(req.session)
        : cartController.getCartBySessionId(req.session)
}

function updateCart (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return cartController.updateCart(req.session)
}