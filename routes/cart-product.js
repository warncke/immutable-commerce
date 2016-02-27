'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var argsFromReq = require('../lib/args-from-req')
var cartProductController = require('../controllers/cart-product')

/* routes */

// create a new cart product entry
router.post('/cart/:cartId/cartProduct', createCartProduct)
// modify an existing cart product
router.put('/cart/:cartId/cartProduct/:cartProductId', updateCartProduct)

module.exports = router

/* route handlers */

function createCartProduct (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartProductController.createCartProduct(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function updateCartProduct (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return cartProductController.updateCartProduct(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}