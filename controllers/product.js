'use strict'

/* application libraries */
var immutable = require('../lib/immutable')
var productModel = require('../models/product')

/* public functions */
var productController = module.exports = immutable.controller('Product', {
    getProducts: getProducts,
})

/**
 * @function getProducts
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getProducts (req) {
    var session = req.session
    // get products
    return productModel.getProducts({
        session: session,
    })
}