'use strict'

/* npm modules */
var _ = require('lodash')
var moment = require('moment')

/* application libraries */
var addressController = require('../../controllers/address')
var addressModel = require('../../models/address')
var availableStates = require('../../config/available-states.js')
var badRequest = require('../../lib/bad-request')
var cartController = require('../../controllers/cart')
var cartModel = require('../../models/cart')
var discountController = require('../../controllers/discount')
var immutable = require('../../lib/immutable')
var log = require('../../lib/log')
var newReq = require('../../lib/new-req')
var notFound = require('../../lib/not-found')
var objectReplace = require('../../lib/object-replace')
var paymentMethodController = require('../../controllers/payment-method')
var paymentMethodModel = require('../../models/payment-method')
var redirect = require('../../lib/redirect')
var spreedlyConfig = require('../../config/spreedly')
var spreedlyDisplayCardType = require('../../lib/spreedly-display-card-type')
var stringify = require('../../lib/stringify')

/* public functions */
var checkoutPaymentController = module.exports = immutable.controller('CheckoutPayment', {
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
    // promises for data that needs to be created
    var createPromises = []
    // load addresses
    var addressesPromise = addressController.getAddresses(newReq({
        query: {addressType: 'billing'},
        session: session,
    }))
    // load cart
    var cartPromise = req.body.cartId
        ? cartController.getCartById(req)
        : cartController.getCartBySessionId(req)
    // load payment methods
    var paymentMethodsPromise = paymentMethodController.getPaymentMethods(req)
    // share variables
    var addresses
    var billingAddress
    var cart
    var paymentMethods
    var view = {
        address: {},
        paymentErrors: [],
    }
    // wait for data to load
    return Promise.all([
        addressesPromise,
        cartPromise,
        paymentMethodsPromise
    ])
    // capture data
    .then(function (res) {
        addresses = view.addresses = res[0]
        cart = res[1]
        paymentMethods = res[2]
        // add formatted payment info to view
        view.paymentMethods = formatPaymentMethodsForView(paymentMethods)
        // get bililng address if already set
        billingAddress = _.find(
            addresses,
            {'addressId': cart.cartData.billingAddressId}
        )
    })
    // delete discount if requested
    .then(function () {
        // get input
        var deleteCoupon = req.body.deleteCoupon || req.query.deleteCoupon
        // skip unless delete requested
        if (!deleteCoupon) {
            return
        }
        // delete active discount
        return discountController.deleteSessionDiscount(req)
        // success
        .then(function () {
            // reload cart so prices can be re-calculated
            return cartController.getCartById(req)
            // success
            .then(function (resCart) {
                cart = resCart
            })
        })
        // error
        .catch(function (err) {
            view.discountCodeError = 'Coupon could not be deleted'
        })
    })
    // save session discount if discount code posted
    .then(function () {
        // skip unless discount was posted
        if (req.body.submit !== 'coupon') {
            return
        }
        // check that code was sent
        if (!req.body.discountCode) {
            view.discountCodeError = 'Please enter a code'
            return
        }
        // attempt to add discount code
        return discountController.createSessionDiscount(req)
        // success
        .then(function (sessionDiscount) {
            // add success message to view
            view.discountCodeMessage = 'Coupon code applied'
            // reload cart so prices can be re-calculated
            return cartController.getCartById(req)
            // success
            .then(function (resCart) {
                cart = resCart
            })
        })
        // error
        .catch(function (err) {
            // invalid code
            if (err.message === 'discount code not found') {
                view.discountCodeError = 'Coupon code not valid'
            }
            // discount expired
            else if (err.message === 'discount expired') {
                var date = moment(err.data.discountEndTime).format('ddd, MMM D, YYYY')
                view.discountCodeError = 'Coupon expired on ' + date
            }
            // discount not yet active
            else if (err.message === 'discount not yet active') {
                var date = moment(err.data.discountStartTime).format('ddd, MMM D, YYYY')
                view.discountCodeError = 'Coupon not valid till ' + date
            }
            else {
                view.discountCodeError = 'Coupon could not be applied'
            }
        })
    })
    // save payment info
    .then(function () {
        // skip unless form posted
        if (req.body.submit !== 'submit') {
            return
        }
        // if an existing payment method was selected then use it
        if (req.body.selectPaymentMethodId) {
            // get the payment method
            var paymentMethod = _.find(
                paymentMethods,
                {'paymentMethodId': req.body.selectPaymentMethodId}
            )
            // cannot continue without payment method
            if (!paymentMethod) {
                return badRequest('payment method not found')
            }
            // add resolved promise
            createPromises.push( Promise.resolve(paymentMethod) )
        }
        // create payment method
        else {
            // parse payment method data sent with form
            try {
                req.body.paymentMethodData = JSON.parse(req.body.paymentMethodData)
            }
            catch (err) {
                return badRequest(err)
            }
            // create new payment record
            createPromises.push(
                paymentMethodModel.createPaymentMethod({
                    accountId: session.accountId,
                    default: req.body.creditCardDefault ? true : false,
                    paymentMethodData: req.body.paymentMethodData,
                    session: session,
                    store: req.body.creditCardStore ? true : false,
                })
            )
        }
    })
    // create billing address
    .then(function () {
        // skip unless form posted
        if (req.body.submit !== 'submit') {
            return
        }
        // create address if necessary
        var createAddressPromise = createBillingAddress(req, cart, billingAddress)
        // add promise to list if it was created
        if (createAddressPromise) {
            createPromises.push(createAddressPromise)
        }
    })
    // wait for create promises to resolve then update cart
    .then(function () {
        // skip unless form submit
        if (req.body.submit !== 'submit') {
            return
        }
        // wait for promises to resolve
        return Promise.all(createPromises)
        // success
        .then(function (res) {
            var paymentMethod = res[0]
            var billingAddress = res[1]
            // add data to cart
            cart.cartData.paymentMethodId = paymentMethod.paymentMethodId
            // billing address may not be set
            if (billingAddress) {
                cart.cartData.billingAddressId = billingAddress.addressId
            }
            // set the use shipping address for billing address flag
            cart.cartData.useShippingAddressForBilling = req.body.useShippingAddressForBilling ? true : false
            // set the credti card store flag
            cart.cartData.creditCardStore = req.body.creditCardStore ? true : false
            // update cart
            return cartModel.createCart({
                cartData: cart.cartData,
                originalCartId: cart.originalCartId,
                parentCartId: cart.cartId,
                session: session,
            })
            // success
            .then(function (resCart) {
                // capture cart
                cart = resCart
            })
        })
    })
    // go to next step it there were no errors
    .then(function () {
        // cannot be finished if not a submit
        if (req.body.submit !== 'submit') {
            return
        }
        // redirect to next checkout step
        return redirect('/checkout/confirm')
    })
    // resolve with data
    .then(function () {
        // add active discount to view
        view.activeDiscount = cart.activeDiscount
        // format address for view
        view.address = addressView(req, cart, billingAddress)
        // add address JSON string to view for client JS
        view.addressesByIdJson = JSON.stringify(_.keyBy(addresses, 'addressId'))
        // format checkout summary for view
        view.checkoutSummary = checkoutSummaryFromCart(cart)
        // format shipping summary for view
        view.shippingSummary = shippingSummaryFromCart(cart)
        // spreedly environment key is used by client app to connect to spreedly
        view.spreedlyEnvironmentKey = spreedlyConfig.spreedlyEnvironmentKey
        // build states data
        view.states = statesFromView(view)
        // use shipping address for billing address - default to true
        view.useShippingAddressForBilling = cart.cartData.useShippingAddressForBilling === false ? false : true
        // store card
        view.creditCardStore = cart.cartData.creditCardStore ? true : false
        // if a message is passed add it to errors
        if (req.query.message) {
            // get message replacing any non-simple characters
            var message = req.query.message.replace(/[^\w^\s]+/g, '')
            // add message to payment errors
            view.paymentProcessingError = message
        }

        return view
    })
}

/* private functions */

function addressFromReq (req) {
    return {
        aptSuite: req.body.aptSuite,
        city: req.body.city,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        state: req.body.state,
        streetAndNumber: req.body.streetAndNumber,
        zipCode: req.body.zipCode,
    }
}

function addressView (req, cart, billingAddress) {
    // if the billing address is already set then always return it
    if (billingAddress) {
        return billingAddress.addressData
    }
    // if shopper has selected to use shipping address for billing then use it
    if (req.body.useShippingAddressForBilling) {
        // use shipping address
        return cart.cartData.shippingAddressView
    }
    // otherwise return form data
    return addressFromReq(req)
}

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
        })
    }
    return checkoutSummary
}

function createBillingAddress (req, cart, billingAddress) {
    // get data for existing billing address if any
    var billingAddressData = billingAddress && billingAddress.addressData
        ? billingAddress.addressData
        : undefined
    // create billing address either from form data or from shipping address
    return req.body.useShippingAddressForBilling
        ? createBillingAddressFromShippingAddress(req, cart, billingAddressData)
        : createBillingAddressFromPost(req, cart, billingAddressData)
}

function createBillingAddressFromPost (req, cart, billingAddressData) {
    var session = req.session
    // get address data from form
    var postAddressData = addressFromReq(req)
    // check if there is already an address and if it matches
    if (billingAddressData && stringify(postAddressData) === stringify(billingAddressData)) {
        // do not create if existing address matches
        return
    }
    // create billing address - use model instead of controller so that
    // validation extensions are not run - this only needs to be validated
    // with the payment transaction
    return addressModel.createAddress({
        accountId: session.accountId,
        addressData: postAddressData,
        addressType: 'billing',
        session: session,
    })
}

function createBillingAddressFromShippingAddress (req, cart, billingAddressData) {
    var session = req.session
    // get shipping address view data
    var shippingAddressView = cart.cartData.shippingAddressView || {}
    // return if view data is already saved
    if (billingAddressData && stringify(shippingAddressView) === stringify(billingAddressData)) {
        return
    }
    // create billing address - use model instead of controller so that
    // validation extensions are not run - this only needs to be validated
    // with the payment transaction
    return addressModel.createAddress({
        accountId: session.accountId,
        addressData: shippingAddressView,
        addressType: 'billing',
        session: session,
    })
}

function formatPaymentMethodsForView (paymentMethods) {
    var viewPaymentMethods = []
    // iterate over payment method data
    for (var i=0; i < paymentMethods.length; i++) {
        var paymentMethod = paymentMethods[i]
        var paymentMethodData = paymentMethod.paymentMethodData
        // require basic data
        if (!(paymentMethodData.card_type && paymentMethodData.last_four_digits && paymentMethodData.month && paymentMethodData.year)) {
            continue
        }
        // add formated data to view
        viewPaymentMethods.push({
            paymentMethodId: paymentMethod.paymentMethodId,
            cardType: spreedlyDisplayCardType(paymentMethodData.card_type),
            cardLastFour: paymentMethodData.last_four_digits,
            cardExpirationMonth: paymentMethodData.month,
            cardExpirationYear: paymentMethodData.year,
            default: paymentMethod.default,
        })
    }
    return viewPaymentMethods
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

function statesFromView (view) {
    // create copy of available states
    var states = _.cloneDeep(availableStates)
    // look for shoppers state
    for (var i=0; i < states.length; i++) {
        var state = states[i]
        // if this is shopper's state then mark as selected
        if (state.abbr === view.address.state) {
            state.selected = true
        }
    }
    return states
}