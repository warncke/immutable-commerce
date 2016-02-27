'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var cartModel = require('../models/cart')
var cartProductModel = require('../models/cart-product')
var cartProductOptionModel = require('../models/cart-product-option')
var conflict = require('../lib/conflict')
var immutable = require('../lib/immutable')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')
var orderModel = require('../models/order')
var productController = require('../controllers/product')
var productModel = require('../models/product')

/* public functions */
var cartController = module.exports = immutable.controller('Cart', {
    createCart: createCart,
    createOrder: createOrder,
    getCartById: getCartById,
    getCartBySessionId: getCartBySessionId,
    updateCart: updateCart,
})

/**
 * @function createCart
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function createCart (req) {
    var session = req.session
    // get input
    var cartData = req.body.cartData
    // create cart
    return cartModel.createCart({
        cartData: cartData,
        session: session,
    })
    // load newly created cart
    .then(function (cart) {
        // set cart id in request for controller
        req.params.cartId = cart.cartId
        // return cart
        return cartController.getCartById(req)
    })
}

/**
 * @function createOrder
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function createOrder (req) {
    var session = req.session
    // get input
    var accountId = session.data.accountId
    var cartId = req.params.cartId
    var sessionId = session.data.sessionId
    // variables to populate in promises
    var cart
    var originalOrderId
    // require account to create order
    if (!accountId) {
        return accessDenied('account required to create order')
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
            return notFound()
        }
        // cart does not belong to current session
        if (resCart.sessionId !== sessionId) {
            return accessDenied()
        }
        // set cart in outer context for other promise handlers
        cart = resCart
    })
    // load cart products
    .then(function () {
        // get sum of quantity for all products in cart
        return cartProductModel.getCartProductsTotalQuantityByCartId({
            cartId: cart.originalCartId,
            session: session,
        })
    })
    // require quantity greater than zero
    .then(function (quantity) {
        if (quantity <= 0) {
            return badRequest('Cannot create order with no products')
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
    // catch duplicate errors
    .catch(function (err) {
        if (isDuplicate(err)) {
            return badRequest('cannot create multiple orders for cart')
        }
        else {
            return Promise.reject(err)
        }
    })
}

/**
 * @function getCartById
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getCartById (req) {
    var session = req.session
    // get input
    var cartId = req.params.cartId
    // variables to populate in promises
    var cart
    var cartProductOptions
    var order
    // load cart
    var cartPromise = cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    // load product options
    var cartProductOptionsPromise = cartProductOptionModel.getCartProductOptions({
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
        cartProductOptionsPromise,
        orderPromise,
    ])
    // build cart
    .then(function (res) {
        cart = res[0]
        cartProductOptions = res[1]
        order = res[2]
        // cart id was not found
        if (!cart) {
            return notFound()
        }
        // cart does not belong to current session
        if (cart.sessionId !== session.originalSessionId) {
            return accessDenied()
        }
        // add associated order to cart
        cart.order = order
        // add associated product options to cart
        cart.productOptions = cartProductOptions
    })
    // load cart products
    .then(function () {
        // load cart products
        return cartProductModel.getCartProductsByCartId({
            cartId: cart.originalCartId,
            session: session,
        })
    })
    // add products to cart
    .then(function (products) {
        // add products to cart
        cart.products = products ? products : {}
        // load product data and merge into products
        return getProductDataForProducts(req, cart.products)
    })
    // return complete cart
    .then(function () {
        return cart
    })
}

/**
 * @function getCartBySessionId
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getCartBySessionId (req) {
    var session = req.session
    // attmept to get cart by session id
    return cartModel.getMostRecentCartBySessionId({
        session: session,
    })
    .then(function (cart) {
        // if cart was not found then create new cart
        if (!cart) {
            return cartController.createCart(req)
        }
        // if cart was found check to make sure it does not have order
        return orderModel.getOrderByCartId({
            cartId: cart.cartId,
            session: session,
        })
        .then(function (order) {
            // cart already has order
            if (order) {
                // create a new cart
                return cartController.createCart(req)
            }
            // cart does not have order
            else {
                // set cart id in request for controller
                req.params.cartId = cart.cartId
                // return existing cart
                return cartController.getCartById(req)
            }
        });
    })
}

/**
 * @function updateCart
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function updateCart (req) {
    var session = req.session
    // get input
    var cartData = req.body.cartData
    var cartId = req.params.cartId
    var originalSessionId = session.data.originalSessionId
    var sessionId = session.data.sessionId
    // capture cart
    var cart
    // load cart
    return cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    // validate cart and create update
    .then(function (resCart) {
        // capture cart
        cart = resCart
        // cart id was not found
        if (!cart) {
            return notFound()
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return accessDenied()
        }
        // create cart
        return cartModel.createCart({
            cartData: cartData,
            originalCartId: cart.originalCartId,
            parentCartId: cart.cartId,
            session: session,
        })
    })
    // load updated cart
    .then(function (resCart) {
        // set new cart id for cart controller to get
        req.params.cartId = resCart.cartId
        // get cart
        return cartController.getCartById(req)
    })
    // catch duplicate errors
    .catch(function (err) {
        // ignore errors other than duplicate key
        if (!isDuplicate(err)) {
            return Promise.reject(err)
        }
        // get latest cart for original cart id
        return cartModel.getMostRecentCartByOriginalCartId({
            originalCartId: cart.originalCartId,
            session: session,
        }).then(function (res) {
            return conflict(res)
        })
    })
}

/* private functions */

function getProductDataForProducts (req, cartProducts) {
    // map of product ids to cart product ids
    var productIds = {}
    // get all cart product ids
    var cartProductIds = Object.keys(cartProducts)
    // nothing to do if no products
    if (!cartProductIds.length) {
        return
    }
    // build map of product ids to cart product ids
    for (var i=0; i < cartProductIds.length; i++) {
        var cartProductId = cartProductIds[i]
        var cartProduct = cartProducts[cartProductId]
        // create entry for product id if it does not already exist
        if (!productIds[cartProduct.productId]) {
            productIds[cartProduct.productId] = []
        }
        // add cart product id to list for product id
        productIds[cartProduct.productId].push(cartProductId)
    }
    // add product ids to request to pass to product controller
    req.query.productId = Object.keys(productIds)
    // call product controller to get product data
    return productController.getProducts(req)
    // merge product data into products
    .then(function (products) {
        // iterate over products merging each into all matching cart product entries
        for (var i=0; i < products.length; i++) {
            var product = products[i]
            // get cart products by product id
            var cartProductIds = productIds[product.productId]
            // merge data to each cart product
            for (var j=0; j < cartProductIds.length; j++) {
                var cartProductId = cartProductIds[j]
                var cartProduct = cartProducts[cartProductId]
                cartProduct.productData = product.productData
            }
        }
    })
}