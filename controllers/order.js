'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var checkAccessByAccountOrSession = require('../lib/check-access-by-account-or-session')
var immutable = require('../lib/immutable')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')
var orderModel = require('../models/order')
var requireAccountDeny = require('../lib/require-account-deny')
var requireFound = require('../lib/require-found')

/* public functions */
var orderController = module.exports = immutable.controller('Order', {
    cancelOrder: cancelOrder,
    getOrder: getOrder,
    getOrders: getOrders,
})

/**
 * @function cancelOrder
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function cancelOrder (req) {
    // make sure order exists
    return orderController.getOrder(req)
    // cancel order
    .then(function (order) {
        return orderModel.cancelOrder({
            orderId: order.orderId,
            session: req.session,
        })
    })
}

/**
 * @function getOrder
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getOrder (req) {
    // get input
    var orderId = req.params.orderId || req.query.orderId || req.body.orderId
    // need order id
    if (!orderId) {
        return notFound()
    }
    // require account
    return requireAccountDeny(req)
    // get order
    .then(function () {
        var orderPromise = orderId.length === 32
            // if the full hex id is passed use that
            ? orderModel.getOrderById({
                orderId: orderId,
                session: req.session,
            })
            // otherwise accept the integer short id
            : orderModel.getOrderByAccountIdAndPartialOrderId({
                accountId: req.session.accountId,
                partialOrderId: parseInt(orderId).toString(16).toUpperCase(),
                session: req.session,
            })
        // return order if found
        return orderPromise
        // return 404 if not found
        .then(requireFound)
        // check access
        .then(function (order) {
            return checkAccessByAccountOrSession(order, req.session)
        })
        // process result
        .then(function (order) {
            // convert partial id to int
            order.intOrderId = parseInt(order.partialOrderId, 16)
            // resolve with order
            return order
        })
    })
}

/**
 * @function getOrders
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getOrders (req) {
    // require account
    return requireAccountDeny(req)
    // get orders
    .then(function () {
        return orderModel.getOrdersByAccountId({
            accountId: req.session.accountId,
            session: req.session,
        })
    })
    // convert partial order ids
    .then(function (orders) {
        // return empty array if orders is not an array
        if (!(orders && orders.length)) {
            return []
        }
        // process all orders
        orders.forEach(function (order) {
            // convert partial id to int
            order.intOrderId = parseInt(order.partialOrderId, 16)
        })
        // resolve with orders
        return orders
    })
}