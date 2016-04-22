'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var setId = require('../lib/set-id.js')

/* public functions */
module.exports = immutable.model('CartProduct', {
    createCartProduct: createCartProduct,
    getCartProductById: getCartProductById,
    getCartProductsByCartId: getCartProductsByCartId,
    getCartProductsTotalQuantityByCartId: getCartProductsTotalQuantityByCartId,
    getMostRecentCartProductByOriginalCartProductId: getMostRecentCartProductByOriginalCartProductId,
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
        originalCartProductId: args.originalCartProductId,
        originalProductId: args.originalProductId,
        parentCartProductId: args.parentCartProductId,
        productId: args.productId,
        quantity: args.quantity,
        cartProductCreateTime: args.session.requestTimestamp
    }
    // create id
    setId(cartProduct, 'cartProductId', 'originalCartProductId')
    // insert part product
    return db('immutable').query(
        'INSERT INTO cartProduct VALUES(UNHEX(:cartProductId), UNHEX(:originalCartProductId), UNHEX(:parentCartProductId), UNHEX(:cartId), UNHEX(:productId), UNHEX(:originalProductId), :quantity, :cartProductCreateTime)',
        cartProduct,
        undefined,
        args.session
    ).then(function () {
        // if no error on insert return data
        return cartProduct
    })
}

/**
 * @function getCartProductById
 *
 * @param {string} cartProductId- hex id of cart product
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getCartProductById (args) {
    // select cart product by id
    return db('immutable').query(
        'SELECT HEX(cartProductId) AS cartProductId, HEX(originalCartProductId) AS originalCartProductId, HEX(parentCartProductId) AS parentCartProductId, HEX(cartId) AS cartId, HEX(productId) AS productId, HEX(originalProductId) AS originalProductId, quantity, cartProductCreateTime FROM cartProduct WHERE cartProductId = UNHEX(:cartProductId) AND cartProductCreateTime <= :requestTimestamp',
        {
            cartProductId: args.cartProductId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.length ? res[0] : undefined
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
    // select all cart product entries
    return db('immutable').query(
        'SELECT HEX(cartProductId) AS cartProductId, HEX(originalCartProductId) AS originalCartProductId, HEX(productId) AS productId, HEX(originalProductId) AS originalProductId, quantity, cartProductCreateTime FROM cartProduct WHERE cartId = UNHEX(:cartId) AND cartProductCreateTime <= :requestTimestamp ORDER BY cartProductCreateTime',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        return buildCartProductData(res)
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
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.numRows === '1' ? parseInt(res[0].quantity) : 0
    })
}

/**
 * @function getMostRecentCartProductByOriginalCartProductId
 *
 * @param {string} originalCartProductId- hex id of original cart product
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMostRecentCartProductByOriginalCartProductId (args) {
    // select most recent cart product by original cart product id
    return db('immutable').query(
        'SELECT HEX(cartProductId) AS cartProductId, HEX(originalCartProductId) AS originalCartProductId, HEX(parentCartProductId) AS parentCartProductId, HEX(cartId) AS cartId, HEX(productId) AS productId, quantity, cartProductCreateTime FROM cartProduct WHERE originalCartProductId = UNHEX(:originalCartProductId) ORDER BY cartProductCreateTime DESC',
        {
            originalCartProductId: args.originalCartProductId,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.length ? res[0] : undefined
    })
}

/* private functions */

/**
 * @function buildCartProductData
 *
 * @param {array} res - database response object
 *
 * @returns {object} cart product data
 */
function buildCartProductData (res) {
    var products = {}
    // build cart product data, grouping by cart product id, summing quantity,
    // and selecting the most recent cart product id
    for (var i = 0; i < res.length; i++) {
        var product = res[i]
        // convert quantity to integer
        product.quantity = parseInt(product.quantity)
        // cart product entry exists
        if (products[product.originalCartProductId]) {
            // update lastUpdateTime
            products[product.originalCartProductId].lastUpdateTime = product.cartProductCreateTime
            // Update lastAddedTime
            if (product.quantity > 0) {
                products[product.originalCartProductId].lastAddedTime = product.cartProductCreateTime
            }
            // sum quantity
            products[product.originalCartProductId].quantity += product.quantity
            // use the most recent cart product id
            products[product.originalCartProductId].cartProductId = product.cartProductId
        }
        // create new cart product entry
        else {
            products[product.originalCartProductId] = product
            products[product.originalCartProductId].createTime = product.cartProductCreateTime
            products[product.originalCartProductId].lastUpdateTime = product.cartProductCreateTime
            products[product.originalCartProductId].lastAddedTime = product.cartProductCreateTime
        }
    }
    // return product summary data
    return products
}
