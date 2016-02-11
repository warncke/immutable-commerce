'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var immutable = require('../lib/immutable')
var productController = require('../controllers/product')

/* routes */

// get list of products
router.get('/product', getProducts)

module.exports = router

/* route handlers */

function getProducts (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return productController.getProducts(req.session)
}