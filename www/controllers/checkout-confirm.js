'use strict'

/* npm modules */
var _ = require('lodash')
var moment = require('moment')

/* application libraries */
var addressController = require('../../controllers/address')
var availableStates = require('../../config/available-states.js')
var cartController = require('../../controllers/cart')
var cartModel = require('../../models/cart')
var immutable = require('../../lib/immutable')
var log = require('../../lib/log')
var newReq = require('../../lib/new-req')
var notFound = require('../../lib/not-found')
var objectReplace = require('../../lib/object-replace')
var orderModel = require('../../models/order')
var paymentMethodModel = require('../../models/payment-method')
var redirect = require('../../lib/redirect')
var spreedlyDisplayCardType = require('../../lib/spreedly-display-card-type')

/* public functions */
var checkoutConfirmController = module.exports = immutable.controller('CheckoutConfirm', {
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
    // promises to resolve
    var cartPromise
    var paymentMethodPromise
    // cart id passed in post
    if (req.body.cartId) {
        // set cart id in params for cart controller
        req.params.cartId = req.body.cartId
        // load cart by id
        cartPromise = cartController.getCartById(req)
    }
    else {
        // get most recent cart for session
        cartPromise = cartController.getCartBySessionId(req)
    }
    // share variables
    var cart
    var view = {
    }
    // wait for cart to resolve
    return cartPromise.then(function (resCart) {
        cart = resCart
    })
    // check to see if cart already has order
    .then(function () {
        if (cart.order && cart.order.orderId) {
            // convert partial order id to integer
            var intOrderId = parseInt(cart.order.partialOrderId, 16)
            // redirect to order complete page
            return redirect('/checkout/complete?orderId='+intOrderId)
        }
    })
    // load payment method
    .then(function () {
        // let other steps progress while payment method loads
        paymentMethodPromise = paymentMethodModel.getPaymentMethodById({
            paymentMethodId: cart.cartData.paymentMethodId,
            session: session,
        })
    })
    // if this is a submit then create order
    .then(function () {
        // skip unless cart id sent
        if (!req.body.cartId) {
            return
        }
        // attempt to place order for cart
        return orderModel.createOrder({
            accountId: session.accountId,
            cartId: req.body.cartId,
            session: session,
        })
    })
    // validate order response
    .then(function (order) {
        // skip unless order was created
        if (!order) {
            return
        }
        // no transaction attempted or transaction success
        // up to extension on order model to decide what to do here
        if (!order.paymentMethodTransaction || (order.paymentMethodTransaction && order.paymentMethodTransaction.paymentMethodTransactionFinish.paymentMethodTransactionSuccess)) {
            // convert partial order id to integer
            var intOrderId = parseInt(order.partialOrderId, 16)
            // redirect to order complete page
            return redirect('/checkout/complete?orderId='+intOrderId)
        }

        /* transaction failed
         *
         * since transaction failed and this order cannot be completed create a new
         * cart and return to checkout flow to modify payment information after which
         * another order will be created for the new cart
         */

        // add order it to cart data so original order id can be set on new order
        cart.cartData.originalOrderId = order.originalOrderId
        // add transaction to cart data
        if (!cart.cartData.paymentMethodTransactions) {
            cart.cartData.paymentMethodTransactions = []
        }
        cart.cartData.paymentMethodTransactions.push(
            order.paymentMethodTransaction.paymentMethodTransactionId
        )
        // create new cart
        return cartModel.createCart({
            cartData: cart.cartData,
            originalCartId: cart.originalCartId,
            parentCartId: cart.cartId,
            session: session,
        })
        // success
        .then(function () {
            // get transaction data
            var transactionData = order.paymentMethodTransaction.paymentMethodTransactionFinish
                && order.paymentMethodTransaction.paymentMethodTransactionFinish.paymentMethodTransactionFinishData
            // get message or set generic message
            var message = transactionData && transactionData.transaction && transactionData.transaction.message
                ? transactionData.transaction.message
                : 'Payment processing error'
            // remove trailing period
            message = message.replace(/\.$/, '')
            // redirect to payment page
            return redirect('/checkout/payment?message='+message)
        })
    })
    // store the final list of products in cart data - after this point
    // any changes to products will be ignored
    .then(function () {
        // format checkout summary information for view and to save on order
        var checkoutSummary = view.checkoutSummary = checkoutSummaryFromCart(cart)
        // make a copy of cart data before performing update
        var cartData = _.cloneDeep(cart.cartData)
        // store checkout summary in cart data
        cartData.checkoutSummary = checkoutSummary
        // save the checkout summary
        return cartModel.createCart({
            cartData: cartData,
            originalCartId: cart.originalCartId,
            parentCartId: cart.cartId,
            session: session,
        })
        // success
        .then(function (resCart) {
            // apply changes to local cart
            _.merge(cart, resCart)
            // set cart id on the view - every checkout must be for specific cart id
            view.cartId = cart.cartId
        })
    })
    // wait for payment method to load
    .then(function () {
        return paymentMethodPromise
        // success
        .then(function (paymentMethod) {
            // format payment info for view
            view.paymentSummary = paymentSummaryFromPaymentMethod(paymentMethod)
        })
    })
    // resolve with data
    .then(function () {
        // format shipping summary for view
        view.shippingSummary = shippingSummaryFromCart(cart)

        return view
    })
}

/* private functions */

function checkoutSummaryFromCart (cart) {
    // cart summary information
    var checkoutSummary = {}
    // product sub total
    checkoutSummary.productTotalPrice = '$' + cart.price.displayProductTotalPrice
    // shipping charge
    checkoutSummary.shippingPrice = cart.price.shippingPrice > 0
        ? '$' + cart.price.displayShippingPrice
        : 'FREE'
    // if there are credits and or discounts add
    if (cart.price.creditAndDiscountSubTotal > 0) {
        checkoutSummary.creditAndDiscountSubTotal = '$' + cart.price.displayCreditAndDiscountSubTotal
    }
    // grand total
    checkoutSummary.totalPrice = '$' + cart.price.displayTotalPrice
    // total number of servings in cart
    checkoutSummary.servings = 0
    // list of products in cart
    checkoutSummary.products = []
    // get cart products
    var cartProducts = _.values(cart.products)
    // iterate over cart products data building summary data
    for (var i=0; i < cartProducts.length; i++) {
        var cartProduct = cartProducts[i]
        // skip products without positive quantity
        if (!(cartProduct.quantity > 0)) {
            continue
        }
        // get product servings
        var productServings = parseInt(cartProduct.productData.servings) || 0
        // add servings to total
        checkoutSummary.servings += productServings
        // add product summary info
        checkoutSummary.products.push({
            name: cartProduct.productData.title,
            quantity: cartProduct.quantity,
            productId: cartProduct.productId,
        })
    }
    return checkoutSummary
}

function paymentSummaryFromPaymentMethod (paymentMethod) {
    // get payment method info
    var paymentMethodData = paymentMethod && paymentMethod.paymentMethodData
    // check if set
    if (!paymentMethodData) {
        return
    }
    // build data
    return {
        aptSuite: paymentMethodData.address2,
        city: paymentMethodData.city,
        cardType: spreedlyDisplayCardType(paymentMethodData.card_type),
        cardLastFour: paymentMethodData.last_four_digits,
        firstName: paymentMethodData.first_name,
        lastName: paymentMethodData.last_name,
        state: paymentMethodData.state,
        streetAndNumber: paymentMethodData.address1,
        zipCode: paymentMethodData.zip,
    }
}

function shippingSummaryFromCart (cart) {
    // get shipping address view data
    var shippingAddressView = cart.cartData.shippingAddressView
    // check if set
    if (!shippingAddressView) {
        return
    }
    // build shipping summary data for view
    return {
        aptSuite: shippingAddressView.aptSuite,
        city: shippingAddressView.city,
        deliveryDate: moment(cart.cartData.deliveryDate).format('ddd, MMM D, YYYY'),
        firstName: shippingAddressView.firstName,
        lastName: shippingAddressView.lastName,
        state: shippingAddressView.state,
        streetAndNumber: shippingAddressView.streetAndNumber,
        zipCode: shippingAddressView.zipCode,
    }
}