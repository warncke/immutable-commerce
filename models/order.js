'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var stableId = require('../lib/stable-id')

/* public functions */
module.exports = immutable.model('Order', {
    createOrder: createOrder,
    getOrderByCartId: getOrderByCartId,
})

/**
 * @function createOrder
 *
 * @param {string} accountId - hex id of logged in user
 * @param {string} cartId - hex id of parent cart
 * @param {string} originalOrderId - hex id of original order
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createOrder (args) {
    // build order data
    var order = {
        accountId: args.accountId,
        cartId: args.cartId,
    }
    // get id without original order id or timestamp since there is only one order per cart
    order.orderId = stableId(order)
    order.originalOrderId = args.originalOrderId
    order.orderCreateTime = args.session.req.requestTimestamp
    // insert order
    return db('immutable').query(
        'INSERT INTO `order` VALUES(UNHEX(:orderId), UNHEX(:originalOrderId), UNHEX(:accountId), UNHEX(:cartId), :orderCreateTime)',
        order
    ).then(function () {
        // return order data on successful insert
        return order
    })
}

/**
 * @function getOrderByCartId
 *
 * @param {string} cartId - hex id of parent cart
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getOrderByCartId (args) {
    return db('immutable').query(
        'SELECT HEX(accountId) AS accountId, HEX(cartId) AS cartId, HEX(orderId) AS orderId, HEX(originalOrderId) AS originalOrderId, orderCreateTime FROM `order` WHERE cartId = UNHEX(:cartId) AND orderCreateTime <= :requestTimestamp',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.req.requestTimestamp
        }
    ).then(function (res) {
        // return order if found
        return res.info.numRows === '1' ? res[0] : undefined
    })
}