'use strict'

/* npm modules */
var _ = require('lodash')
var moment = require('moment')

/* application libraries */
var cartModel = require('../../models/cart')
var immutable = require('../../lib/immutable')
var notFound = require('../../lib/not-found')
var orderModel = require('../../models/order')

/* public functions */
var checkoutCompleteController = module.exports = immutable.controller('CheckoutComplete', {
    get: get,
})

/**
 * @function get
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function get (req) {
    var session = req.session
    // get order id
    var intOrderId = parseInt(req.query.orderId)
    // if no order id need to do something
    if (!intOrderId) {
        // ??
        return redirect('/')
    }
    // convert integer order it to hex
    var partialOrderId = intOrderId.toString(16).toUpperCase()
    // share variables
    var cart
    var order
    var view = {}
    // attempt to load order
    return orderModel.getOrderByAccountIdAndPartialOrderId({
        accountId: session.accountId,
        partialOrderId: partialOrderId,
        session: session,
    })
    // order loaded
    .then(function (resOrder) {
        // return 404 on invalid order id
        if (!resOrder) {
            return notFound()
        }
        // capture order
        order = resOrder
        // load cart to get order details
        return cartModel.getCartById({
            cartId: order.cartId,
            session: session,
        })
    })
    // cart loaded
    .then(function (resCart) {
        // capture cart
        cart = resCart
    })
    // build data for view
    .then(function () {
        // set formated delivery date for view
        view.deliveryDate = moment(cart.cartData.deliveryDate).format('ddd, MMM D')
        // set order id for view
        view.intOrderId = intOrderId
        // resolve with view data
        return view
    })
}

/* private functions */