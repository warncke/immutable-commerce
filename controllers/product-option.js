'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var accountProductOptionModel = require('../models/account-product-option')
var badRequest = require('../lib/bad-request')
var cartModel = require('../models/cart')
var cartProductModel = require('../models/cart-product')
var cartProductOptionModel = require('../models/cart-product-option')
var immutable = require('../lib/immutable')
var orderModel = require('../models/order')
var productModel = require('../models/product')
var sessionProductOptionModel = require('../models/session-product-option')

/* public functions */
var productOptionController = module.exports = immutable.controller('ProductOption', {
    createProductOption: createProductOption,
    getProductOptions: getProductOptions,
})

/**
 * @function createProductOption
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function createProductOption (req) {
    var session = req.session
    // get input
    var cartId = req.body.cartId
    var optionName = req.body.optionName
    var optionValue = req.body.optionValue
    var productId = req.body.productId
    // validate input
    if (optionName === undefined) {
        return badRequest('optionName required')
    }
    if (optionValue === undefined) {
        return badRequest('optionValue required')
    }
    if (productId === undefined) {
        return badRequest('productId required')
    }
    // list of promises to resolve concurrently
    var promises = []
    // data to load
    var cart
    var cartProducts
    var order
    var product
    // get product
    var productPromise = productModel.getProductById({
        productId: productId,
        session: session,
    })
    // add to promises
    promises.push(productPromise)
    // if cart id was passed then get cart and cart products
    if (cartId) {
        // get cart
        var cartPromise = cartModel.getCartById({
            cartId: cartId,
            session: session,
        })
        // get order
        var orderPromise = orderModel.getOrderByCartId({
            cartId: cartId,
            session: session,
        })
        // add to promises
        promises.push(cartPromise, orderPromise)
    }
    // wait for all promises to resolve
    return Promise.all(promises)
    // validate product, create proudct option entries
    .then(function (res) {
        product = res[0]
        cart = res[1]
        order = res[2]
        cartProducts = res[3]
        // cart products will only be loaded if cart id was set
        var cartProductsPromise
        // require product
        if (!product) {
            return badRequest('product not found')
        }
        // if cart id was set validate cart
        if (cartId) {
            // cart id was not found
            if (!cart) {
                return notFound()
            }
            // cart does not belong to current session
            if (cart.sessionId !== session.sessionId) {
                return accessDenied()
            }
            // get cart products
            cartProductsPromise = cartProductModel.getCartProductsByCartId({
                cartId: cart.originalCartId,
                session: session,
            })
        }
        // promises for inserts
        var promises = []
        // create product option entry on session
        var sessionProductOptionPromise = sessionProductOptionModel.createSessionProductOption({
            optionName: optionName,
            optionValue: optionValue,
            originalProductId: product.originalProductId,
            productId: product.productId,
            session: session,
        })
        // add to promises
        promises.push(sessionProductOptionPromise)
        // if session is logged into account then also store the product option at the account level
        if (session.accountId) {
            // create product option entry on account
            var accountProductOptionPromise = accountProductOptionModel.createAccountProductOption({
                accountId: session.accountId,
                optionName: optionName,
                optionValue: optionValue,
                originalProductId: product.originalProductId,
                productId: product.productId,
                session: session,
            })
            // add to promises
            promises.push(accountProductOptionPromise)
        }
        // if cart products were loaded then apply product options to any
        // cart product entries for product in cart
        if (cartProductsPromise) {
            return cartProductsPromise.then(function (cartProducts) {
                // get all cart product ids
                var cartProductIds = Object.keys(cartProducts)
                // iterate over cart products
                for (var i=0; i < cartProductIds.length; i++) {
                    var cartProductId = cartProductIds[i]
                    var cartProduct = cartProducts[cartProductId]
                    // skip unless product id matches
                    if (cartProduct.productId !== productId) {
                        continue
                    }
                    // create product option entry for cart product
                    var cartProductOptionPromise = cartProductOptionModel.createCartProductOption({
                        cartId: cart.originalCartId,
                        cartProductId: cartProduct.originalCartProductId,
                        optionName: optionName,
                        optionValue: optionValue,
                        productId: productId,
                        session: session,
                    })
                    // add to promises
                    promises.push(cartProductOptionPromise)
                }
                // wait for all inserts to complete
                return Promise.all(promises)
            })
        }
        else {
            // wait for all inserts to complete
            return Promise.all(promises)
        }
    })
    // after all updates complete return current product options
    .then(function () {
        return productOptionController.getProductOptions(req)
    })
}

/**
 * @function getProductOptions
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getProductOptions (req) {
    var session = req.session

    return sessionProductOptionModel.getSessionProductOptions({
        session: session,
    })
}