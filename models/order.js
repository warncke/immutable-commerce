'use strict'

/* application libraries */
var db = require('../lib/database')
var stableId = require('../lib/stable-id')

function createOrder (accountId, cartId, originalOrderId, requestTimestamp) {
    // build order data
    var order = {
        accountId: accountId,
        cartId: cartId,
    }
    // get id without original order id or timestamp since there is only one order per cart
    order.orderId = stableId(order)
    order.originalOrderId = originalOrderId
    order.orderCreateTime = requestTimestamp
    // insert order
    return db('immutable').query(
        'INSERT INTO `order` VALUES(UNHEX(:orderId), UNHEX(:originalOrderId), UNHEX(:accountId), UNHEX(:cartId), :orderCreateTime)',
        order
    ).then(function (res) {
        // return order data on successful insert
        return order
    })
}

function getOrderByCartId (cartId, requestTimestamp) {
    return db('immutable').query(
        'SELECT HEX(accountId) AS accountId, HEX(cartId) AS cartId, HEX(orderId) AS orderId, HEX(originalOrderId) AS originalOrderId, orderCreateTime FROM `order` WHERE cartId = UNHEX(:cartId) AND orderCreateTime <= :requestTimestamp',
        {cartId: cartId, requestTimestamp: requestTimestamp}
    ).then(function (res) {
        // return order if found
        return res.info.numRows == 1 ? res[0] : undefined
    })
}

module.exports = {
    createOrder: createOrder,
    getOrderByCartId: getOrderByCartId,
}