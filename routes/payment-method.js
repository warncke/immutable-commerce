'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var paymentMethodController = require('../controllers/payment-method')

/* routes */

// create a new payment method
router.post('/payment-method', apiRouteHandler(paymentMethodController.createPaymentMethod))
// delete a stored payment method
router.delete('/payment-method/:paymentMethodId', apiRouteHandler(paymentMethodController.deletePaymentMethod))
// get a stored payment by id
router.get('/payment-method/:paymentMethodId', apiRouteHandler(paymentMethodController.getPaymentMethodById))
// get list of stored payment methods
router.get('/payment-method', apiRouteHandler(paymentMethodController.getPaymentMethods))

module.exports = router
