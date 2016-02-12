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
    // call controller function
    return productController.getProducts(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}