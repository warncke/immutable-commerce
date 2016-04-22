'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var cartProductController = require('../controllers/cart-product')

/* routes */

// create a new cart product entry
router.post('/cart/:cartId/cartProduct', apiRouteHandler(cartProductController.createCartProduct))
// modify an existing cart product
router.put('/cart/:cartId/cartProduct/:cartProductId', apiRouteHandler(cartProductController.updateCartProduct))

module.exports = router