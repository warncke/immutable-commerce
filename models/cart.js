'use strict'

/* npm libraries */

var isObject = require('isobject')

/* application libraries */

var db = require('../lib/database.js')
var stableId = require('../lib/stable-id.js')



function createCart (cartData, originalCartId, sessionId, requestTimestamp) {
    // build cart data
    var cart = {
        originalCartId: originalCartId,
        sessionId: sessionId,
        cartCreateTime: requestTimestamp,
    }
    // store cart data if passed and valid
    if (isObject(cartData)) {
        cart.cartData = JSON.stringify(cartData)
    }
    // otherwise set default value
    else {
        cart.cartData = '{}'
    }
    // get cart id
    cart.cartId = stableId(cart)
    // insert cart
    return db('immutable').query(
        'INSERT INTO cart VALUES(UNHEX(:cartId), UNHEX(:originalCartId), UNHEX(:sessionId), :cartCreateTime, :cartData)',
        cart
    ).then(function (res) {
        // deserialize cartData
        cart = unpackCartData(cart)

        return cart
    })
}

function getCartById (cartId, requestTimestamp) {
    // require cart id
    if (!cartId) {
        return Promise.resolve()
    }
    // select cart by id
    return db('immutable').query(
        'SELECT HEX(cartId) AS cartId, originalCartId, HEX(sessionId) AS sessionId, cartData, cartCreateTime FROM cart WHERE cartId = UNHEX(:cartId) AND cartCreateTime <= :requestTimestamp',
        {cartId: cartId, requestTimestamp: requestTimestamp}
    ).then(function (res) {
        // return cart if found
        return res.info.numRows == 1 ? unpackCartData(res[0]) : undefined
    })

}

function getMostRecentCartBySessionId (originalSessionId, sessionId, requestTimestamp) {
    return db('immutable').query(
        // select the most recent cart associated with the session
        'SELECT HEX(cartId) AS cartId, originalCartId, HEX(sessionId) AS sessionId, cartData, cartCreateTime FROM cart c WHERE c.sessionId IN( UNHEX(:originalSessionId), UNHEX(:sessionId) ) AND cartCreateTime <= :requestTimestamp ORDER BY cartCreateTime DESC LIMIT 1',
        {originalSessionId: originalSessionId, sessionId: sessionId, requestTimestamp: requestTimestamp}
    ).then(function (res) {
        // return cart if found
        return res.info.numRows == 1 ? unpackCartData(res[0]) : undefined
    })
}

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

module.exports = {
    createCart: createCart,
    getCartById: getCartById, 
    getMostRecentCartBySessionId: getMostRecentCartBySessionId,
}