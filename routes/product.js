'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var productController = require('../controllers/product')

/* routes */

// get list of products
router.get('/product', apiRouteHandler(productController.getProducts))

module.exports = router