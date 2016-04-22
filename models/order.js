'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var setId = require('../lib/set-id')

/* public functions */
module.exports = immutable.model('Order', {
    cancelOrder: cancelOrder,
    createOrder: createOrder,
    getOrderByAccountIdAndPartialOrderId: getOrderByAccountIdAndPartialOrderId,
    getOrderByCartId: getOrderByCartId,
    getOrderById: getOrderById,
    getOrdersByAccountId: getOrdersByAccountId,
})

/**
 * @function cancelOrder
 *
 * @param {string} orderId - hex id of order
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function cancelOrder (args) {
    // build data
    var orderCancel = {
        orderId: args.orderId,
        sessionId: args.session.sessionId,
        orderCancelCreateTime: args.session.requestTimestamp,
    }
    // get id
    setId(orderCancel, 'orderCancelId')
    // insert record
    return db('immutable').query(`
        INSERT INTO orderCancel VALUES(
            UNHEX(:orderCancelId),
            UNHEX(:orderId),
            UNHEX(:sessionId),
            :orderCancelCreateTime
        )`,
        orderCancel,
        undefined,
        args.session
    ).then(function () {
        // return data on success
        return orderCancel
    })
}

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
        originalOrderId: args.originalOrderId,
        parentOrderId: args.parentOrderId,
        sessionId: args.session.sessionId,
        orderCreateTime: args.session.requestTimestamp,
    }
    // get id
    setId(order, 'orderId', 'originalOrderId')
    // create partial order id from first 4 bytes that is unique per account
    // and provides a short easy to use 32 bit integer id
    order.partialOrderId = order.orderId.substr(0,8)
    // insert order
    return db('immutable').query(
        'INSERT INTO `order` VALUES(UNHEX(:orderId), UNHEX(:originalOrderId), UNHEX(:parentOrderId), UNHEX(:partialOrderId), UNHEX(:accountId), UNHEX(:cartId), UNHEX(:sessionId), :orderCreateTime)',
        order,
        undefined,
        args.session
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
        'SELECT HEX(orderId) AS orderId, HEX(originalOrderId) AS originalOrderId, HEX(parentOrderId) AS parentOrderId, HEX(partialOrderId) AS partialOrderId, HEX(accountId) AS accountId, HEX(cartId) AS cartId, HEX(sessionId) AS sessionId, orderCreateTime FROM `order` WHERE cartId = UNHEX(:cartId) AND orderCreateTime <= :requestTimestamp',
        {
            cartId: args.cartId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return order if found
        return res.info.numRows === '1' ? res[0] : undefined
    })
}

/**
 * @function getOrderByAccountIdAndPartialOrderId
 *
 * @param {string} accountId - partial hex order id
 * @param {string} partialOrderId - partial hex order id
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getOrderByAccountIdAndPartialOrderId (args) {
    return db('immutable').query(`
        SELECT
            HEX(o.orderId) AS orderId,
            HEX(o.originalOrderId) AS originalOrderId,
            HEX(o.parentOrderId) AS parentOrderId,
            HEX(o.partialOrderId) AS partialOrderId,
            HEX(o.accountId) AS accountId,
            HEX(o.cartId) AS cartId,
            HEX(o.sessionId) AS sessionId,
            o.orderCreateTime,
            HEX(oc.orderCancelId) AS orderCancelId,
            oc.orderCancelCreateTime
        FROM \`order\` o
        LEFT JOIN orderCancel oc ON o.orderId = oc.orderId
        WHERE
            (o.accountId IS NULL OR o.accountId = UNHEX(:accountId))
        AND o.partialOrderId = UNHEX(:partialOrderId)
        AND o.orderCreateTime <= :requestTimestamp
        `,
        {
            accountId: args.accountId,
            partialOrderId: args.partialOrderId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return order if found
        return res.info.numRows === '1' ? res[0] : undefined
    })
}

/**
 * @function getOrderById
 *
 * @param {string} orderId - partial hex order id
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getOrderById (args) {
    return db('immutable').query(`
        SELECT
            HEX(o.orderId) AS orderId,
            HEX(o.originalOrderId) AS originalOrderId,
            HEX(o.parentOrderId) AS parentOrderId,
            HEX(o.partialOrderId) AS partialOrderId,
            HEX(o.accountId) AS accountId,
            HEX(o.cartId) AS cartId,
            HEX(o.sessionId) AS sessionId,
            o.orderCreateTime,
            HEX(oc.orderCancelId) AS orderCancelId,
            oc.orderCancelCreateTime
        FROM \`order\` o
        LEFT JOIN orderCancel oc ON o.orderId = oc.orderId
        WHERE
            o.orderId = UNHEX(:orderId)
        AND o.orderCreateTime <= :requestTimestamp
        `,
        {
            orderId: args.orderId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return order if found
        return res.info.numRows === '1' ? res[0] : undefined
    })
}

/**
 * @function getOrdersByAccountId
 *
 * @param {string} accountId - partial hex order id
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getOrdersByAccountId (args) {
    return db('immutable').query(`
        SELECT
            HEX(o.orderId) AS orderId,
            HEX(o.originalOrderId) AS originalOrderId,
            HEX(o.parentOrderId) AS parentOrderId,
            HEX(o.partialOrderId) AS partialOrderId,
            HEX(o.accountId) AS accountId,
            HEX(o.cartId) AS cartId,
            HEX(o.sessionId) AS sessionId,
            o.orderCreateTime,
            HEX(oc.orderCancelId) AS orderCancelId,
            oc.orderCancelCreateTime
        FROM \`order\` o
        LEFT JOIN \`order\` o2 ON o2.parentOrderId = o.orderId
        LEFT JOIN orderCancel oc ON o.orderId = oc.orderId
        WHERE
            o2.parentOrderId IS NULL
        AND o.accountId = UNHEX(:accountId)
        `,
        {
            accountId: args.accountId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return order if found
        return res
    })
}