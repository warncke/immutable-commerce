var express = require('express')
var router = express.Router()

var CartController = require('../controllers/cart')

// get most recent active cart for session or create new cart
router.get('/cart', getCart)
// always create new cart
router.post('/cart', createCart)
// get specific cart by id
router.get('/cart/:cartId', getCart)
// modify product quantity - returns current cart contents
router.post('/cart/:cartId/product/:productId', cartProduct)
// create order for cart
router.post('/cart/:cartId/order', createOrder)

module.exports = router

/* route handlers */

function cartProduct (req, res, next) {
    var cartController = new CartController(req, res, next)

    return cartController.cartProduct()
}

function createCart (req, res, next) {
    var cartController = new CartController(req, res, next)

    return cartController.createCart()
}

function createOrder (req, res, next) {
    var cartController = new CartController(req, res, next)

    return cartController.createOrder()
}

function getCart (req, res, next) {
    var cartController = new CartController(req, res, next)

    return req.params.cartId
        ? cartController.getCartById()
        : cartController.getCartBySessionId()
}