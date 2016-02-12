'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('CartProduct', {
    createCartProduct: createCartProduct,
    getCartProductsByCartId: getCartProductsByCartId,
    getCartProductsSummaryByCartId: getCartProductsSummaryByCartId,
    getCartProductsTotalQuantityByCartId: getCartProductsTotalQuantityByCartId,
})

/**
 * @function createCartProduct
 *
 * @param {string} cartId - hex id of parent cart
 * @param {string} productId - hex id of product being modified
 * @param {integer} quantity - quantity of modification (positive or negative)
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createCartProduct (args) {
    // build cart product
    var cartProduct = {
        cartId: args.cartId,
        productId: args.productId,
        quantity: args.quantity,
        cartProductCreateTime: args.session.req.requestTimestamp
    }
    // insert part product
    return db('immutable').query(
        'INSERT INTO cartProduct VALUES(UNHEX(:cartId), UNHEX(:productId), :quantity, :cartProductCreateTime)',
        cartProduct,
        undefined,
        args.session
    ).then(function () {
        // if no error on insert return data
        return cartProduct
    })
}

/**
 * @function getCartProductsByCartId
 *
 * @param {string} cartId - hex id of parent cart
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartProductsByCartId (args) {
    // select cart products
    return db('immutable').query(
        'SELECT HEX(p.productId) AS productId, HEX(p.productDataId) AS productDataId, HEX(p.originalProductId) AS originalProductId, SUM(cp.quantity) as quantity, cp.cartProductCreateTime, p.productData, p.productCreateTime FROM cartProduct cp JOIN product p ON cp.productId = p.productId WHERE cp.cartId = UNHEX(:cartId) AND cp.cartProductCreateTime <= :requestTimestamp GROUP BY p.productId',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.req.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        for (var i=0; i < res.length; i++) {
            // convert product data to JSON
            res[i].productData = JSON.parse(res[i].productData)
        }
        return res
    });
}

/**
 * @function getCartProductsSummaryByCartId
 *
 * @param {string} cartId - hex id of parent cart
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartProductsSummaryByCartId (args) {
    // select cart products
    return db('immutable').query(
        'SELECT HEX(productId) AS productId, SUM(quantity) AS quantity FROM cartProduct WHERE cartId = UNHEX(:cartId) AND cartProductCreateTime <= :requestTimestamp GROUP BY productId',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.req.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        var products = {}
        // build product quantity data
        for (var i = 0; i < res.length; i++) {
            var product = res[i]
            products[product.productId] = product.quantity
        }
        // return product summary data
        return products
    })
}

/**
 * @function getCartProductsTotalQuantityByCartId
 *
 * @param {string} cartId - hex id of parent cart
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartProductsTotalQuantityByCartId (args) {
    // select cart products
    return db('immutable').query(
        'SELECT SUM(quantity) AS quantity FROM cartProduct WHERE cartId = UNHEX(:cartId) AND cartProductCreateTime <= :requestTimestamp',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.req.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.numRows === '1' ? parseInt(res[0].quantity) : 0
    })
}