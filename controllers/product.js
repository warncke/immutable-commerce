'use strict'

/* helper functions */

var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')

/* models */

var productModel = require('../models/product')

/* Product Controller Object */

function Product(req, res, next) {
    this.req = req
    this.res = res
    this.next = next
}

Product.prototype.getProducts = function getProducts () {
    var productController = this
    // get input
    var requestTimestamp = productController.req.requestTimestamp
    // get products
    productModel.getProducts(requestTimestamp)
    // return response
    .then(function (res) {
        productController.res.json(res)
        productController.res.end()
    })
    // catch errors
    .catch(function (err) {
        productController.next(err)
    })
}

module.exports = Product