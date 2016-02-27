'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var argsFromReq = require('../lib/args-from-req')
var productOptionController = require('../controllers/product-option')

/* routes */

// get product options
router.get('/productOption', getProductOptions)
// create new product option selection
router.post('/productOption', createProductOption)

module.exports = router

/* route handlers */

function createProductOption (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return productOptionController.createProductOption(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function getProductOptions (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return productOptionController.getProductOptions(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}