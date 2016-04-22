'use strict'

/* application libraries */
var buildProductOptions = require('../lib/build-product-options')
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('CartProductOption', {
    createCartProductOption: createCartProductOption,
    getCartProductOptions: getCartProductOptions,
})

/**
 * @function createCartProductOption
 *
 * @param {string} cartId - hex id of original cart
 * @param {string} cartProductId - hex id of original cart product
 * @param {string} optionName
 * @param {string} optionValue
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createCartProductOption (args) {
    // insert product publish
    return db('immutable').query(
        'INSERT INTO `cartProductOption` VALUES(UNHEX(:cartId), UNHEX(:cartProductId), :optionName, :optionValue, :cartProductOptionCreateTime)',
        {
            cartId: args.cartId,
            cartProductId: args.cartProductId,
            optionName: args.optionName,
            optionValue: args.optionValue,
            cartProductOptionCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.affectedRows === '1' ? true : false
    })
}

/**
 * @function getCartProductOptions
 *
 * @param {string} cartId - hex id of cart to get options for
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartProductOptions (args) {
    // get product options
    return db('immutable').query(
        'SELECT HEX(cartId) AS cartId, HEX(cartProductId) AS productId, optionName, optionValue FROM cartProductOption WHERE cartId = UNHEX(:cartId) AND cartProductOptionCreateTime <= :cartProductOptionCreateTime ORDER BY cartProductOptionCreateTime',
        {
            cartId: args.cartId,
            cartProductOptionCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return buildProductOptions(res)
    })
}