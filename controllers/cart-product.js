'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var cartController = require('../controllers/cart')
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
var sessionProductOptionModel = require('../models/session-product-option')

/* public functions */
var cartProductController = module.exports = immutable.controller('CartProduct', {
    createCartProduct: createCartProduct,
    updateCartProduct: updateCartProduct,
})

/**
 * @function createCartProduct
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function createCartProduct (req) {
    var session = req.session
    // get input
    var cartId = req.params.cartId
    var originalSessionId = session.data.originalSessionId
    var productId = req.body.productId
    var quantity = parseInt(req.body.quantity)
    var sessionId = session.data.sessionId
    // require product id
    if (!productId) {
        return badRequest('productId required')
    }
    // require number for quantity
    if (typeof quantity !== 'number') {
        return badRequest('Invalid quantity - integer required')
    }
    // data to load
    var cart
    var cartProduct
    var order
    var product
    var sessionProductOptions
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
    var productPromise = productModel.getProductById({
        productId: productId,
        session: session,
    })
    // load product session product options to apply to product when adding to cart
    // the result of this is not needed until after cart product is created
    var sessionProductOptionsPromise = sessionProductOptionModel.getSessionProductOptions({
        session: session,
    })
    // wait for data to load
    return Promise.all([
        cartPromise,
        orderPromise,
        productPromise,
    ])
    // create product quantity modification for cart if it does not have order
    .then(function (res) {
        cart = res[0]
        order = res[1]
        product = res[2]
        // cart id was not found
        if (!cart) {
            return notFound()
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return accessDenied()
        }
        // product not found
        if (!product) {
            return badRequest('product not found')
        }
        // product modifications on carts with orders not allowed
        if (order) {
            return badRequest('Product modification not allowed on cart with order')
        }
        // insert cart product modification
        return cartProductModel.createCartProduct({
            cartId: cart.originalCartId,
            productId: productId,
            quantity: quantity,
            session: session,
        })
    })
    // store newly created cart product
    .then(function (res) {
        cartProduct = res
    })
    // wait for session product options to load
    .then(function () {
        return sessionProductOptionsPromise
    })
    // create cart product options from session product options
    .then(function (res) {
        sessionProductOptions = res
        // get product options for product id if any
        var productOptions = sessionProductOptions[productId]
        // if there are no options for product then do nothing
        if (!productOptions) {
            return
        }
        // promises for cart product options that need to be created
        var createCartProductOptionPromises = []
        // get names of all options set for product
        var optionNames = Object.keys(productOptions)
        // create cart product options for each option name and value
        for (var i=0; i < optionNames.length; i++) {
            var optionName = optionNames[i]
            var optionValue = productOptions[optionName]
            // create cart product option
            var createCartProductOptionPromise = cartProductOptionModel.createCartProductOption({
                cartId: cartId,
                cartProductId: cartProduct.cartProductId,
                optionName: optionName,
                optionValue: optionValue,
                productId: cartProduct.productId,
                session: session,
            })
            // add promise to list
            createCartProductOptionPromises.push(createCartProductOptionPromise)
        }
        // wait for all cart product options to be created
        return Promise.all(createCartProductOptionPromises)
    })
    // get refreshed cart on success
    .then(function (res) {
        return cartController.getCartById(req)
    })
    // add the newly created cart product as param on cart
    .then(function (cart) {
        cart.cartProduct = cartProduct
        return cart
    })
}

/**
 * @function updateCartProduct
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function updateCartProduct (req) {
    var session = req.session
    // get input
    var cartId = req.params.cartId
    var cartProductId = req.params.cartProductId
    var originalSessionId = session.data.originalSessionId
    var quantity = parseInt(req.body.quantity)
    var sessionId = session.data.sessionId
    // require number for quantity
    if (typeof quantity !== 'number') {
        return badRequest('Invalid quantity - integer required')
    }
    // data to be loaded
    var cart
    var cartProduct
    var order
    var product
    // load cart
    var cartPromise = cartModel.getCartById({
        cartId: cartId,
        session: session,
    })
    // load cart product
    var cartProductPrommise = cartProductModel.getCartProductById({
        cartProductId: cartProductId,
        session: session,
    })
    // load order
    var orderPromise = orderModel.getOrderByCartId({
        cartId: cartId,
        session: session,
    })
    // wait for data to load
    return Promise.all([
        cartPromise,
        cartProductPrommise,
        orderPromise,
    ])
    // create product quantity modification for cart if it does not have order
    .then(function (res) {
        cart = res[0]
        cartProduct = res[1]
        order = res[2]
        // cart id was not found
        if (!cart) {
            return notFound()
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return accessDenied()
        }
        // cart product id not found
        if (!cartProduct) {
            return badRequest('cartProductId not found')
        }
        // product modifications on carts with orders not allowed
        if (order) {
            return badRequest('Product modification not allowed on cart with order')
        }
        // insert cart product modification
        return cartProductModel.createCartProduct({
            cartId: cart.originalCartId,
            originalCartProductId: cartProduct.originalCartProductId,
            parentCartProductId: cartProduct.cartProductId,
            productId: cartProduct.productId,
            quantity: quantity,
            session: session,
        })
    })
    // catch duplicate errors
    .catch(function (err) {
        // ignore errors other than duplicate key
        if (!isDuplicate(err)) {
            return Promise.reject(err)
        }
        // get latest cart for original cart id
        return cartProductModel.getMostRecentCartProductByOriginalCartProductId({
            originalCartProductId: cartProduct.originalCartProductId,
            session: session,
        }).then(function (res) {
            return conflict(res)
        })
    })
    // get refreshed cart on success
    .then(function (res) {
        cartProduct = res
        // get cart
        return cartController.getCartById(req)
    })
    // add the newly created cart product as param on cart
    .then(function (cart) {
        cart.cartProduct = cartProduct
        // resolve with cart
        return cart
    })
}