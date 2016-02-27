'use strict'

/* npm libraries */

var isObject = require('isobject')

/* application libraries */

var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var stableId = require('../lib/stable-id.js')
var stringify = require('json-stable-stringify')

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
        originalCartId: args.originalCartId,
        parentCartId: args.parentCartId,
        sessionId: args.session.originalSessionId,
        cartCreateTime: args.session.requestTimestamp,
    }
    // store cart data if passed and valid
    if (isObject(args.cartData)) {
        cart.cartData = stringify(args.cartData)
    }
    // otherwise set default value
    else {
        cart.cartData = '{}'
    }
    // get cart id
    var cartId = cart.cartId = stableId(cart)
    // this is original if it is not a modification
    if (!cart.originalCartId) {
        cart.originalCartId = cartId
    }
    // insert cart
    return db('immutable').query(
        'INSERT INTO cart VALUES(UNHEX(:cartId), UNHEX(:originalCartId), UNHEX(:parentCartId),UNHEX(:sessionId), :cartCreateTime, :cartData)',
        cart,
        undefined,
        args.session
    ).then(function () {
        // deserialize cartData
        return unpackCartData(cart)
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
        return res.length ? unpackCartData(res[0]) : undefined
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
        'SELECT HEX(cartId) AS cartId, HEX(originalCartId) AS originalCartId, HEX(parentCartId) AS parentCartId, HEX(sessionId) AS sessionId, cartData, cartCreateTime FROM cart WHERE originalCartId = UNHEX(:originalCartId) ORDER BY cartCreateTime DESC LIMIT 1',
        {
            originalCartId: args.originalCartId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return cart if found
        return res.length ? unpackCartData(res[0]) : undefined
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
        'SELECT HEX(cartId) AS cartId, HEX(originalCartId) AS originalCartId, HEX(parentCartId) AS parentCartId, HEX(sessionId) AS sessionId, cartData, cartCreateTime FROM cart c WHERE c.sessionId = UNHEX(:sessionId) AND cartCreateTime <= :requestTimestamp ORDER BY cartCreateTime DESC LIMIT 1',
        {
            requestTimestamp: args.session.requestTimestamp,
            sessionId: args.session.originalSessionId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return cart if found
        return res.length ? unpackCartData(res[0]) : undefined
    })
}

/* private functions */

function unpackCartData (cart) {
    // do nothing if undefined
    if (typeof cart.cartData === 'undefined') {
        return cart
    }
    // catch exceptions on JSON.parse and set default value
    try {
        cart.cartData = JSON.parse(cart.cartData)
    }
    catch (ex) {
        cart.cartData = {}
    }

    return cart
}