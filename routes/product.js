'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var argsFromReq = require('../lib/args-from-req')
var immutable = require('../lib/immutable')
var productController = require('../controllers/product')

/* routes */

// get list of products
router.get('/product', getProducts)

module.exports = router

/* route handlers */

function getProducts (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return productController.getProducts(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}