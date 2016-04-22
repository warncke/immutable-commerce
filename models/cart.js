'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('Cart', {
    createCart: createCart,
    getCartById: getCartById,
    getMostRecentCartByOriginalCartId: getMostRecentCartByOriginalCartId,
    getMostRecentCartBySessionId: getMostRecentCartBySessionId,
})

/**
 * @function createCart
 *
 * @param {object} cartData - data to store with cart
 * @param {string} originalCartId - hex id of original cart
 * @param {string} parentCartId - hex id of parent cart being modified
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createCart (args) {
    // build cart data
    var cart = {
        cartData: stringifyObject(args.cartData),
        cartCreateTime: args.session.requestTimestamp,
        originalCartId: args.originalCartId,
        parentCartId: args.parentCartId,
        sessionId: args.session.sessionId,
    }
    // set id
    setId(cart, 'cartId', 'originalCartId')
    // copy deliveryDate and mealPlanId from cartData
    cart.deliveryDate = args.cartData && args.cartData.deliveryDate
    cart.mealPlanId = args.cartData && args.cartData.mealPlanId
    // insert cart
    return db('immutable').query(
        'INSERT INTO cart VALUES(UNHEX(:cartId), UNHEX(:originalCartId), UNHEX(:parentCartId),UNHEX(:sessionId), :cartCreateTime, :cartData, :deliveryDate, :mealPlanId)',
        cart,
        undefined,
        args.session
    ).then(function () {
        // deserialize cartData
        return jsonParseMulti(cart, 'cartData')
    })
}

/**
 * @function getCartById
 *
 * @param {string} cartId - hex id of parent cart
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartById (args) {
    // select cart by id
    return db('immutable').query(
        'SELECT HEX(cartId) AS cartId, HEX(originalCartId) AS originalCartId, HEX(parentCartId) AS parentCartId, HEX(sessionId) AS sessionId, cartData, cartCreateTime FROM cart WHERE cartId = UNHEX(:cartId) AND cartCreateTime <= :requestTimestamp',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return cart if found
        return res.length ? jsonParseMulti(res[0], 'cartData') : undefined
    })

}

/**
 * @function getCartByOriginalCartId
 *
 * @param {string} originalCartId - hex id of parent cart
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMostRecentCartByOriginalCartId (args) {
    // select cart by id
    return db('immutable').query(
        'SELECT HEX(c.cartId) AS cartId, HEX(c.originalCartId) AS originalCartId, HEX(c.parentCartId) AS parentCartId, HEX(c.sessionId) AS sessionId, c.cartData, c.cartCreateTime FROM cart c LEFT JOIN cart c2 ON c.cartId = c2.parentCartId WHERE c2.cartId IS NULL AND c.originalCartId = UNHEX(:originalCartId) ORDER BY c.cartCreateTime DESC LIMIT 1',
        {
            originalCartId: args.originalCartId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return cart if found
        return res.length ? jsonParseMulti(res[0], 'cartData') : undefined
    })

}

/**
 * @function getMostRecentCartBySessionId
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getMostRecentCartBySessionId (args) {
    return db('immutable').query(
        // select the most recent cart associated with the session
        'SELECT HEX(c.cartId) AS cartId, HEX(c.originalCartId) AS originalCartId, HEX(c.parentCartId) AS parentCartId, HEX(c.sessionId) AS sessionId, c.cartData, c.cartCreateTime FROM cart c LEFT JOIN cart c2 ON c.cartId = c2.parentCartId WHERE c2.cartId IS NULL AND c.sessionId = UNHEX(:sessionId) ORDER BY c.cartCreateTime DESC LIMIT 1',
        {
            requestTimestamp: args.session.requestTimestamp,
            sessionId: args.session.sessionId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return cart if found
        return res.length ? jsonParseMulti(res[0], 'cartData') : undefined
    })
}