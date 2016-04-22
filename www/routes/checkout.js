'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var checkoutCompleteController = require('../controllers/checkout-complete')
var checkoutConfirmController = require('../controllers/checkout-confirm')
var checkoutPaymentController = require('../controllers/checkout-payment')
var checkoutShippingController = require('../controllers/checkout-shipping')
var wwwRouteHandler = require('../../lib/www-route-handler')

/* routes */

// complete controller
router.get('/checkout/complete', wwwRouteHandler({
    controllerFunction: checkoutCompleteController.get,
    requireAccount: true,
    template: 'checkoutComplete',
}))

// confirm controller
var confirmHandler = wwwRouteHandler({
    controllerFunction: checkoutConfirmController.get,
    requireAccount: true,
    template: 'checkoutConfirm',
})

router.get('/checkout/confirm', confirmHandler)
router.post('/checkout/confirm', confirmHandler)

// payment controller
var paymentHandler = wwwRouteHandler({
    controllerFunction: checkoutPaymentController.get,
    requireAccount: true,
    template: 'checkoutPayment',
})

router.get('/checkout/payment', paymentHandler)
router.post('/checkout/payment', paymentHandler)

// shipping controller
var shippingHandler = wwwRouteHandler({
    controllerFunction: checkoutShippingController.get,
    requireAccount: true,
    template: 'checkoutShipping',
})

router.get('/checkout/shipping', shippingHandler)
router.post('/checkout/shipping', shippingHandler)

module.exports = router