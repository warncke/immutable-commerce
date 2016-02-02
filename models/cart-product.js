'use strict'

/* application libraries */
var db = require('../lib/database')
var stableId = require('../lib/stable-id')



function createCartProduct (cartId, productId, quantity, requestTimestamp) {
    // build cart product
    var cartProduct = {
        cartId: cartId,
        productId: productId,
        quantity: quantity,
        cartProductCreateTime: requestTimestamp
    }
    // insert part product
    return db('immutable').query(
        'INSERT INTO cartProduct VALUES(UNHEX(:cartId), UNHEX(:productId), :quantity, :cartProductCreateTime)',
        cartProduct
    ).then(function (res) {
        // if no error on insert return data
        return cartProduct
    })
}

function getCartProductsSummaryByCartId (cartId, originalCartId, requestTimestamp) {
    // select cart products
    return db('immutable').query(
        'SELECT HEX(productId) AS productId, SUM(quantity) AS quantity FROM cartProduct WHERE cartId IN (UNHEX(:cartId), UNHEX(:originalCartId) ) AND cartProductCreateTime <= :requestTimestamp GROUP BY productId',
        {cartId: cartId, requestTimestamp: requestTimestamp}
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

module.exports = {
    createCartProduct: createCartProduct,
    getCartProductsSummaryByCartId: getCartProductsSummaryByCartId,
}