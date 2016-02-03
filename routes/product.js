'use strict'

/* npm libraries */

var express = require('express')
var router = express.Router()

/* application libraries */

var ProductController = require('../controllers/product')

// get list of products
router.get('/product', getProducts)

module.exports = router

/* route handlers */

function getProducts (req, res, next) {
    var productController = new ProductController(req, res, next)

    return productController.getProducts()
}