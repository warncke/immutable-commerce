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
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getProducts (session) {
    // get products
    productModel.getProducts({
        session: session,
    })
    // return response
    .then(function (res) {
        session.res.json(res)
        session.res.end()
    })
    // catch errors
    .catch(function (err) {
        session.next(err)
    })
}