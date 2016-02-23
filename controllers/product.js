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
    // get input
    var productIds = req.query.productId
    // if product ids were passed make sure they are array
    if (productIds && !Array.isArray(productIds)) {
        productIds = [productIds]
    }

    return productIds
        // if product ids were passed then only fetch those products
        ? productModel.getProductsById({productIds: productIds, session: session})
        // otherwise get all products
        : productModel.getProducts({session: session})
}