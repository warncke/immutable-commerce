'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var cartController = require('../controllers/cart')

/* routes */

// get most recent active cart for session or create new cart
router.get('/cart', apiRouteHandler(cartController.getCartBySessionId))
// always create new cart
router.post('/cart', apiRouteHandler(cartController.createCart))
// get specific cart by id
router.get('/cart/:cartId', apiRouteHandler(cartController.getCartById))
// update cart
router.put('/cart/:cartId', apiRouteHandler(cartController.updateCart))
// create order for cart
router.post('/cart/:cartId/order', apiRouteHandler(cartController.createOrder))

module.exports = router