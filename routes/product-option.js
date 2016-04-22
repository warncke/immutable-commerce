'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var productOptionController = require('../controllers/product-option')

/* routes */

// get product options
router.get('/productOption', apiRouteHandler(productOptionController.getProductOptions))
// create new product option selection
router.post('/productOption', apiRouteHandler(productOptionController.createProductOption))

module.exports = router