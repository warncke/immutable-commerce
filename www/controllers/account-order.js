'use strict'

/* npm modules */
var _ = require('lodash')
var moment = require('moment')

/* application libraries */
var accessDenied = require('../../lib/access-denied')
var cartController = require('../../controllers/cart')
var cartModel = require('../../models/cart')
var immutable = require('../../lib/immutable')
var newReq = require('../../lib/new-req')
var notFound = require('../../lib/not-found')
var orderModel = require('../../models/order')
var packageJson = require('../../lib/package-json')
var spreedlyDisplayCardType = require('../../lib/spreedly-display-card-type')

/* public functions */
var acountOrderController = module.exports = immutable.controller('AccountOrder', {
    getOrder: getOrder,
    getOrders: getOrders,
})

/**
 * @function getOrder
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getOrder (req) {
    var session = req.session
    // get input
    var intOrderId = parseInt(req.params.intOrderId)
    // convert integer order it to hex
    var partialOrderId = intOrderId.toString(16).toUpperCase()
    // shared variables
    var view = {
        css: [
            '/site/sites/all/themes/freshrealm_apps/css/order-'+packageJson.version+'.css',
        ],
        title: 'Order '+intOrderId,
    }
    // load order
    return orderModel.getOrderByAccountIdAndPartialOrderId({
        accountId: session.accountId,
        partialOrderId: partialOrderId,
        session: session,
    })
    // order loaded
    .then(function (order) {
        // return 404 on invalid order id
        if (!order) {
            return notFound()
        }
        // load cart to get order details
        return cartController.getCartById(newReq({
            params: {cartId: order.cartId},
            session: session,
        }))
        // success
        .then(function (cart) {
            // add cart to order
            order.cart = cart
            // resolve with order
            return order
        })
    })
    // build data for view
    .then(function (order) {
        // build order data
        view.order = buildOrderView(order)
        // build payment method data
        view.paymentMethod = buildPaymentMethodView(order.cart.paymentMethod)
        // build product data
        view.products = buildProductView(order.cart.products)
        // get shipping address
        view.shippingAddress = order.cart.shippingAddress.addressData

        // resolve with view data
        return view
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
    var session = req.session
    // shared variables
    var view = {
        css: [
            '/site/sites/all/themes/freshrealm_apps/css/order-'+packageJson.version+'.css',
        ],
        title: 'Orders'
    }
    // get orders and cart data
    return orderModel.getOrdersByAccountId({
        accountId: session.accountId,
        session: session,
    })
    // success
    .then(function (orders) {
        // promises for data to be loaded
        var promises = []
        // load related data for each order
        _.forEach(orders, function (order) {
            // get cart - order id came from account so no auth needed
            var cartPromise = cartModel.getCartById({
                cartId: order.cartId,
                session: session,
            })
            // success
            .then(function (cart) {
                // add cart to order
                order.cart = cart
            })
            // add promises
            promises.push(cartPromise)
        })
        // wait for all promises to resolve
        return Promise.all(promises)
        // success
        .then(function () {
            // resolve with orders, populated with related data
            return orders
        })
    })
    // build data for view
    .then(function (orders) {
        // add order data to view
        view.orders = buildOrdersView(orders)
        // resolve with view data
        return view
    })
}

/* private functions */

/**
 * @function buildOrderView
 *
 * @param {object} order - order model with cart and other data
 *
 * @returns {object}
 */
function buildOrderView (order) {
    return {
        creditAndDiscountSubTotal: order.cart.cartData.checkoutSummary.creditAndDiscountSubTotal,
        deliveryDateUnix: moment(order.cart.cartData.deliveryDate).unix(),
        deliveryDate: moment(order.cart.cartData.deliveryDate).format('ddd, MMM D'),
        orderCreateDate: moment(order.orderCreateTime).format('MM/DD/YY'),
        intOrderId: parseInt(order.partialOrderId, 16),
        shippingPrice: order.cart.cartData.checkoutSummary.shippingPrice,
        productTotalPrice: order.cart.cartData.checkoutSummary.productTotalPrice,
        totalPrice: order.cart.cartData.checkoutSummary.totalPrice,
    }
}

/**
 * @function buildOrdersView
 *
 * @param {array} orders - order models with cart and other data
 *
 */
function buildOrdersView (orders) {
    // array of orders for view
    var viewOrders = []
    // iterate over orders getting data for view
    _.forEach(orders, function (order) {
        // add order data to view
        viewOrders.push( buildOrderView(order) )
    })
    // sort orders by delivery date
    viewOrders = _.sortBy(viewOrders, 'deliveryDateUnix')
    // return sorted orders
    return viewOrders
}

/**
 * @function buildProductView
 *
 * @param {object} products
 *
 * @returns {array}
 */
function buildProductView (products) {
    // array of product for view
    var viewProducts = []
    // iterate over products build data
    _.forEach(products, function (product) {
        // get quantity
        var quantity = parseInt(product.quantity)
        // require positive quantity
        if (!(quantity > 0)) {
            return
        }
        // get servings
        var servings = parseInt(product.productData.servings) || 1
        // get total servings
        var totalServings = quantity * servings
        // add formatted product data to list
        viewProducts.push({
            image: product.productData.main_image,
            name: product.productData.title,
            price: '$' + product.price.displayTotalPrice,
            servings: totalServings,
            servingTerm: totalServings > 1 ? 'servings' : 'serving',
            tastemaker: product.productData.tastemaker_name,
        })
    })
    // sort products by name
    viewProducts = _.sortBy(viewProducts, 'name')
    // return sorted products
    return viewProducts
}

/**
 * @function buildPaymentMethodView
 *
 * @param {object} paymentMethod
 *
 * @returns {object}
 */
function buildPaymentMethodView (paymentMethod) {
    return {
        cardLastFour: paymentMethod.paymentMethodData.last_four_digits,
        cardType: spreedlyDisplayCardType(paymentMethod.paymentMethodData.card_type),
    }
}