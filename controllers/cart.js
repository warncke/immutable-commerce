'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var cartModel = require('../models/cart')
var cartProductModel = require('../models/cart-product')
var immutable = require('../lib/immutable')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')
var orderModel = require('../models/order')
var productModel = require('../models/product')

/* public functions */
var cartController = module.exports = immutable.controller('Cart', {
    cartProduct: cartProduct,
    createCart: createCart,
    createOrder: createOrder,
    getCartById: getCartById,
    getCartBySessionId: getCartBySessionId,
    updateCart: updateCart,
})

/**
 * @function cartProduct
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function cartProduct (session) {
    // get input
    var cartId = session.req.params.cartId
    var originalSessionId = session.data.originalSessionId
    var productId = session.req.params.productId
    var quantity = parseInt(session.req.body.quantity)
    var sessionId = session.data.sessionId
    // require number for quantity
    if (typeof quantity !== 'number') {
        return session.next(badRequest('Invalid quantity - integer required'))
    }
    // load cart
    var cartPromise = cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    // load order
    var orderPromise = orderModel.getOrderByCartId({
        cartId: cartId,
        session: session,
    })
    // load product
    var productIdPromise = productModel.getProductId({
        productId: productId,
        session: session,
    })
    // wait for data to load
    return Promise.all([
        cartPromise,
        orderPromise,
        productIdPromise
    ])
    // create product quantity modification for cart if it does not have order
    .then(function (res) {
        var cart = res[0]
        var order = res[1]
        var productId = res[2]
        // cart id was not found
        if (!cart) {
            return Promise.reject(notFound())
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return Promise.reject(accessDenied())
        }
        // product id not found
        if (!productId) {
            return Promise.reject(badRequest('productId not found'))
        }
        // product modifications on carts with orders not allowed
        if (order) {
            return Promise.reject(badRequest('Product modification not allowed on cart with order'))
        }
        // if cart is a modification then link all changes to the original cart
        // so that products do not get spread out between modifications and lost
        var productCartId = cart.originalCartId || cart.cartId
        // insert cart product modification
        return cartProductModel.createCartProduct({
            cartId: productCartId,
            productId: productId,
            quantity: quantity,
            session: session,
        })
    })
    // return refreshed cart on success
    .then(function () {
        return cartController.getCartById(session)
    })
    // catch errors
    .catch(function (err) {
        session.next(err)
    })
}

/**
 * @function createCart
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createCart (session) {
    // get input
    var cartData = session.req.body.cartData
    var originalCartId;
    // create cart
    return cartModel.createCart({
        cartData: cartData,
        originalCartId: originalCartId,
        session: session,
    })
    // add default properties
    .then(function (cart) {
        cart.products = {}
        return cart
    })
    // return response
    .then(function (res) {
        session.res.json(res)
        session.res.end()
    })
    // catch errors
    .catch(function (err) {
        session.next(err)
    })
}

/**
 * @function createOrder
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createOrder (session) {
    // get input
    var accountId = session.data.accountId
    var cartId = session.req.params.cartId
    var sessionId = session.data.sessionId
    // variables to populate in promises
    var cart
    var originalOrderId
    // require account to create order
    if (!accountId) {
        session.next(accessDenied('account required to create order'))
    }
    // load cart
    return cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    // validate access
    .then(function (resCart) {
        // cart id was not found
        if (!resCart) {
            return Promise.reject(notFound())
        }
        // cart does not belong to current session
        if (resCart.sessionId !== sessionId) {
            return Promise.reject(accessDenied())
        }
        // set cart in outer context for other promise handlers
        cart = resCart
    })
    // load cart products
    .then(function () {
        // always use original cart id if set
        var productCartId = cart.originalCartId || cart.cartId
        // get sum of quantity for all products in cart
        return cartProductModel.getCartProductsTotalQuantityByCartId({
            cartId: productCartId,
            session: session,
        })
    })
    // require quantity greater than zero
    .then(function (quantity) {
        if (quantity <= 0) {
            return Promise.reject(badRequest('Cannot create order with no products'))
        }
    })
    // load order for original cart
    .then(function () {
        // skip unless cart is a modification of another cart
        if (!cart.originalCartId) {
            return
        }
        // load order for original cart
        return orderModel.getOrderByCartId({
            cartId: cart.originalCartId,
            session: session,
        })
    })
    // get original order id if any
    .then(function (order) {
        // if the original cart has order then link that to new order
        originalOrderId = order ? order.orderId : undefined
    })
    // create order
    .then(function () {
        return orderModel.createOrder({
            accountId: accountId,
            cartId: cartId,
            session: session,
        })
    })
    // return response
    .then(function (res) {
        session.res.json(res)
        session.res.end()
    })
    // catch errors
    .catch(function (err) {
        if (isDuplicate(err)) {
            session.next(badRequest('cannot create multiple orders for cart'))
        }
        else {
            session.next(err)
        }
    })
}

/**
 * @function getCartById
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartById (session) {
    // get input
    var cartId = session.req.params.cartId
    var originalSessionId = session.data.originalSessionId
    var sessionId = session.data.sessionId
    // variables to populate in promises
    var cart
    // load cart
    var cartPromise = cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    // load order
    var orderPromise = orderModel.getOrderByCartId({
        cartId: cartId,
        session: session,
    })
    // wait for all data to load
    return Promise.all([
        cartPromise,
        orderPromise
    ])
    // build cart
    .then(function (res) {
        cart = res[0]
        var order = res[1]
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
    })
    // load products
    .then(function () {
        // always use original cart id
        var productCartId = cart.originalCartId || cart.cartId
        // load cart products
        return cartProductModel.getCartProductsSummaryByCartId({
            cartId: productCartId,
            session: session,
        })
    })
    // add products to cart
    .then(function (products) {
        cart.products = products
    })
    // return response
    .then(function () {
        session.res.json(cart)
        session.res.end()
    })
    // catch errors
    .catch(function (err) {
        session.next(err)
    })
}

/**
 * @function getCartBySessionId
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getCartBySessionId (session) {
    // attmept to get cart by session id
    cartModel.getMostRecentCartBySessionId({
        session: session,
    })
    .then(function (cart) {
        // if cart was not found then create new cart
        if (!cart) {
            return cartController.createCart(session)
        }
        // if cart was found check to make sure it does not have order
        return orderModel.getOrderByCartId({
            cartId: cart.cartId,
            session: session,
        })
        .then(function (order) {
            // if order was found return new cart
            if (order) {
                return cartController.createCart(session)
            }
            // otherwise return current cart
            else {
                // set cart id in request for controller
                session.req.params.cartId = cart.cartId
                // get cart
                return cartController.getCartById(session)
            }
        });
    }).catch(function (err) {
        session.next(err)
    })
}

/**
 * @function updateCart
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function updateCart (session) {
    // get input
    var cartData = session.req.body.cartData
    var cartId = session.req.params.cartId
    var originalSessionId = session.data.originalSessionId
    var sessionId = session.data.sessionId
    // load cart
    cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    .then(function (cart) {
        // cart id was not found
        if (!cart) {
            return Promise.reject(notFound())
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return Promise.reject(accessDenied())
        }
        // original cart id is either current cart or its original cart id
        var originalCartId = cart.originalCartId || cart.cartId
        // create cart
        return cartModel.createCart({
            cartData: cartData,
            originalCartId: originalCartId,
            session: session,
        })
    })
    // return response
    .then(function (res) {
        session.res.json(res)
        session.res.end()
    })
    // catch errors
    .catch(function (err) {
        session.next(err)
    })
}