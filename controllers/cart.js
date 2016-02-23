'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var cartModel = require('../models/cart')
var cartProductModel = require('../models/cart-product')
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
    createCartProduct: createCartProduct,
    createOrder: createOrder,
    getCartById: getCartById,
    getCartBySessionId: getCartBySessionId,
    updateCart: updateCart,
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
        //if (!productId) {
        //    return badRequest('productId not found')
        //}
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
    // add default properties
    .then(function (cart) {
        cart.products = {}
        return cart
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
    var originalSessionId = session.data.originalSessionId
    var sessionId = session.data.sessionId
    // variables to populate in promises
    var cart
    var order
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
        orderPromise,
    ])
    // build cart
    .then(function (res) {
        cart = res[0]
        order = res[1]
        // cart id was not found
        if (!cart) {
            return notFound()
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return accessDenied()
        }
        // add associated order to cart
        cart.order = order
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
        cart.products = products
        // load product data and merge into products
        return getProductDataForProducts(req, products)
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
            // order not found
            if (!order) {
                // set cart id in request for controller
                req.params.cartId = cart.cartId
                // get cart
                return cartController.getCartById(req)
            }
            // return current cart
            return cartController.createCart(req)
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
    // load product
    var productPromise = productModel.getProductById({
        productId: productId,
        session: session,
    })
    // wait for data to load
    return Promise.all([
        cartPromise,
        cartProductPrommise,
        orderPromise,
        productPromise,
    ])
    // create product quantity modification for cart if it does not have order
    .then(function (res) {
        cart = res[0]
        cartProduct = res[1]
        order = res[2]
        product = res[3]
        // cart id was not found
        if (!cart) {
            return notFound()
        }
        // cart does not belong to current session
        if (cart.sessionId !== sessionId && cart.sessionId !== originalSessionId) {
            return accessDenied()
        }
        // product not found
        //if (!productId) {
        //    return badRequest('productId not found')
        //}
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
            productId: productId,
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

/* private functions */

function getProductDataForProducts (req, cartProducts) {
    // map of product ids to cart product ids
    var productIds = {}
    // get all cart product ids
    var cartProductIds = Object.keys(cartProducts)
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