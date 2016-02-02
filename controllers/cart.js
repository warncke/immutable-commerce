'use strict'

/* npm libraries */

var _ = require('lodash')

/* helper functions */

var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')

/* models */

var cartModel = require('../models/cart')
var orderModel = require('../models/order')
var cartProductModel = require('../models/cart-product')

/* Cart Controller Object */

function Cart(req, res, next) {
    this.req = req
    this.res = res
    this.next = next
}

Cart.prototype.cartProduct = function cartProduct () {
    var cartController = this
    // get input
    var cartId = cartController.req.params.cartId
    var originalSessionId = cartController.req.session.data.originalSessionId
    var productId = cartController.req.params.productId
    var quantity = parseInt(cartController.req.body.quantity)
    var requestTimestamp = cartController.req.requestTimestamp
    var sessionId = cartController.req.session.data.sessionId
    // require number for quantity
    if (typeof quantity !== 'number') {
        return cartController.next(badRequest('Invalid quantity - integer required'))
    }
    // load cart
    var cartPromise = cartModel.getCartById(cartId, requestTimestamp)
    // load order
    var orderPromise = orderModel.getOrderByCartId(cartId, requestTimestamp)
    // wait for data to load
    return Promise.all([
        cartPromise,
        orderPromise
    ])
    // create product quantity modification for cart if it does not have order
    .then(function (res) {
        var cart = res[0]
        var order = res[1]
        // cart id was not found
        if (!cart) {
            return Promise.reject(notFound())
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return Promise.reject(accessDenied())
        }
        // product modifications on carts with orders not allowed
        if (order) {
            return Promise.reject(badRequest('Product modification not allowed on cart with order'))
        }
        // insert cart product modification
        return cartProductModel.createCartProduct(
            cartId,
            productId,
            quantity,
            requestTimestamp
        )        
    })
    // return refreshed cart on success
    .then(function (res) {
        return cartController.getCartById()
    })
    // catch errors
    .catch(function (err) {
        cartController.next(err)
    })
}

Cart.prototype.createCart = function createCart () {
    var cartController = this
    // get input
    var cartData = undefined
    var originalCartId = undefined
    var requestTimestamp = cartController.req.requestTimestamp
    var sessionId = cartController.req.session.data.sessionId
    // create cart
    return cartModel.createCart(
        cartData,
        originalCartId,
        sessionId,
        requestTimestamp
    )
    // return response
    .then(function (res) {
        cartController.res.json(res)
        cartController.res.end()
    })
    // catch errors
    .catch(function (err) {
        cartController.next(err)
    })
}

Cart.prototype.createOrder = function createOrder () {
    var cartController = this
    // get input
    var accountId = cartController.req.session.data.accountId
    var cartId = cartController.req.params.cartId
    var requestTimestamp = cartController.req.requestTimestamp
    var sessionId = cartController.req.session.data.sessionId
    // require account to create order
    if (!accountId) {
        cartController.next(accessDenied('account required to create order'))
    }
    // load cart
    return cartModel.getCartById(cartId, requestTimestamp).then(function (cart) {
        // cart id was not found
        if (!cart) {
            return Promise.reject(notFound())
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId) {
            return Promise.reject(accessDenied())
        }

        return cart
    })
    // load cart products
    .then(function (cart) {
        return cartProductModel.getCartProductsSummaryByCartId(
            cart.cartId,
            cart.originalCartId,
            requestTimestamp)
        .then(function (products) {
            // require products in cart
            //if (!(_.sum(_.values(products)) > 0)) {
            //    return Promise.reject(badRequest('Cannot create order with no products'))
            //}

            return [cart, products]
        })
    })
    // create order for cart if found
    .then(function (args) {
        var cart = args[0]
        var products = args[1]
        // if cart is a modification of another cart
        if (cart.originalCartId) {
            // if the original cart has order then link that to new order
            return orderModel.getOrderByCartId(cart.originalCartId, requestTimestamp).then(function (order) {
                // create order for cart
                return orderModel.createOrder(accountId, cartId, order.orderId, requestTimestamp)
            })
        }
        // cart has no previous instances
        else {
            // create order for cart
            return orderModel.createOrder(accountId, cartId, undefined, requestTimestamp)
        }
    })
    // return response
    .then(function (res) {
        cartController.res.json(res)
        cartController.res.end()
    })
    // catch errors
    .catch(function (err) {
        if (isDuplicate(err)) {
            cartController.next(badRequest('cannot create multiple orders for cart'))
        }
        else {
            cartController.next(err)
        }
    })
}

Cart.prototype.getCartById = function getCartById (cartId) {
    var cartController = this
    // get input
    if (!cartId) {
        cartId = cartController.req.params.cartId
    }
    var originalSessionId = cartController.req.session.data.originalSessionId
    var requestTimestamp = cartController.req.requestTimestamp
    var sessionId = cartController.req.session.data.sessionId
    // return 404 if no id in request
    if (!cartId) {
        cartController.next(notFound())
    }
    // load cart
    var cartPromise = cartModel.getCartById(cartId, requestTimestamp)
    // load order
    var orderPromise = orderModel.getOrderByCartId(cartId, requestTimestamp)
    // wait for all data to load
    return Promise.all([
        cartPromise,
        orderPromise
    ])
    // build cart
    .then(function (args) {
        var cart = args[0]
        var order = args[1]
        // cart id was not found
        if (!cart) {
            return Promise.reject(notFound())
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return Promise.reject(accessDenied())
        }
        // add associated order to cart
        cart.order = order

        return cart
    })
    // load products
    .then(function (cart) {
        // load cart products
        return cartProductModel.getCartProductsSummaryByCartId(
            cart.cartId,
            cart.originalCartId,
            requestTimestamp
        ).then(function (products) {
            // add associated products to cart
            cart.products = products

            return cart
        })
    })
    // return response
    .then(function (res) {
        cartController.res.json(res)
        cartController.res.end()
    })
    // catch errors
    .catch(function (err) {
        cartController.next(err)
    })
}

Cart.prototype.getCartBySessionId = function getCartBySessionId () {
    var cartController = this
    // get input
    var originalSessionId = cartController.req.session.data.originalSessionId
    var requestTimestamp = cartController.req.requestTimestamp
    var sessionId = cartController.req.session.data.sessionId
    // attmept to get cart by session id
    cartModel.getMostRecentCartBySessionId(
        originalSessionId,
        sessionId,
        requestTimestamp
    ).then(function (cart) {
        // if cart was not found then create new cart
        if (!cart) {
            return cartController.createCart()
        }
        // if cart was found check to make sure it does not have order
        return orderModel.getOrderByCartId(cart.cartId, requestTimestamp).then(function (order) {
            return order
                // if order was found return new cart
                ? cartController.createCart()
                // otherwise return current cart
                : cartController.getCartById(cart.cartId)
        });
    }).catch(function (err) {
        cartController.next(err)
    })
}

module.exports = Cart