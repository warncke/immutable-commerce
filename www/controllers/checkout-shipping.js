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
var redirect = require('../../lib/redirect')
var stringify = require('../../lib/stringify')

/* private variables */
var addressParamNames = [
    'aptSuite',
    'city',
    'deliveryInstructions',
    'firstName',
    'lastName',
    'phoneNumber',
    'state',
    'streetAndNumber',
    'zipCode',
]

/* public functions */
var checkoutShippingController = module.exports = immutable.controller('CheckoutShipping', {
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
    // load cart
    var cartPromise
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
    // load addresses
    var addressesPromise = addressController.getAddresses(newReq({
        query: {addressType: 'shipping'},
        session: session,
    }))
    // share variables
    var addresses
    var cart
    var view = {
        // copy addres params from post to view if set
        address: _.pick(req.body, addressParamNames),
        // list of errors for address
        addressErrors: [],
        // list of errors for delivery date
        deliveryDateErrors: [],
        // map of fields with validation errors
        validationErrors: {},
    }
    // wait for cart and shipping addresses to resolve
    return Promise.all([
        addressesPromise,
        cartPromise,
    ])
    // capture loaded data
    .then(function (res) {
        addresses = res[0]
        cart = res[1]
    })
    // check if zip code or delivery date has changed
    .then(function () {
        return submitDeliveryInfo(req, cart, view)
    })
    // try to create address if form posted
    .then(function () {
        return submitAddressInfo(req, cart, addresses, view)
    })
    // save current address to cart - use model instead of controller
    // because the result is not need and it is much lighter
    .then(function () {
        // skip unless form submit
        if (!req.body.submit) {
            return
        }
        // save view data to cart - full address data may be saved also
        // if it passed validation but it is easier to save both and the
        // view will always contain the latest correct data
        cart.cartData.shippingAddressView = view.address
        // save cart data
        return cartModel.createCart({
            cartData: cart.cartData,
            originalCartId: cart.originalCartId,
            parentCartId: cart.cartId,
            session: session,
        })
    })
    // validate that delivery dates are available
    .then(function () {
        // add errors if no delivery dates available
        if (!(cart.cartData.availableDeliveryDates && cart.cartData.availableDeliveryDates.length)) {
            view.validationErrors.deliveryDate = true
            view.deliveryDateErrors.push('No delivery dates available for selected zip code')
        }
    })
    // go to next step it there were no errors
    .then(function () {
        // cannot be finished if not a submit
        if (!req.body.submit) {
            return
        }
        // not finished if there are errors
        if (view.addressErrors.length || view.deliveryDateErrors.length || view.addressValidateFailed) {
            return
        }
        // if there is already a payment method set on cart then go to confirm
        if (cart.cartData.paymentMethodId) {
            return redirect('/checkout/confirm')
        }
        // otherwise get payment
        else {
            return redirect('/checkout/payment')
        }
    })
    // add addresses data to view
    .then(function () {
        // most recent address
        var lastAddress
        // find most recent address
        for (var i=0; i < addresses.length; i++) {
            var address = addresses[i]
            // find last address
            if (address.last) {
                lastAddress = address
                break
            }
        }
        // add address array to view
        view.addresses = addresses
        // add address JSON string to view for client JS
        view.addressesByIdJson = JSON.stringify(_.keyBy(addresses, 'addressId'))
        // set default address values if form not posted
        if (!req.body.submit) {
            // if cart has address set then use it
            if (cart.cartData.shippingAddressId) {
                view.address = cart.cartData.shippingAddressView
            }
            // if there is a saved address use it
            else if (lastAddress) {
                view.address = lastAddress.addressData
            }
            // otherwise use zip code data
            else if (cart.cartData.zipCodeData) {
                var zipCodeData = cart.cartData.zipCodeData
                // set city, state, and zip from cart zip code
                view.address = {
                    city: zipCodeData.city,
                    state: zipCodeData.state,
                    zipCode: zipCodeData.zipCode,
                }
            }
        }
    })
    // resolve with data
    .then(function () {
        // mark the selected shipping address
        setActiveShippingAddress(cart, view)
        // format available delivery dates for view
        view.deliveryDates = deliveryDatesFromCart(cart)
        // format checkout summary information for view
        view.checkoutSummary = checkoutSummaryFromCart(cart)
        // build states data
        view.states = statesFromView(view)

        return view
    })
}

/* private funtions */

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

function deliveryDatesFromCart (cart) {
    // array of delivery dates
    var deliveryDates = []
    // get available delivery dates from cart
    var availableDeliveryDates = cart.cartData.availableDeliveryDates
    // get selected delivery date
    var deliveryDate = cart.cartData.deliveryDate
    // if input data is not set then return
    if (!(availableDeliveryDates && deliveryDate)) {
        return deliveryDates
    }
    // build delivery dates from available delivery dates
    for (var i=0; i < availableDeliveryDates.length; i++) {
        var availableDeliveryDate = availableDeliveryDates[i]
        // add delivery date to list
        deliveryDates.push({
            value: availableDeliveryDate,
            text: moment(availableDeliveryDate).format('ddd, MMM D, YYYY'),
            selected: deliveryDate === availableDeliveryDate ? true : false,
        })
    }
    return deliveryDates
}

function setActiveShippingAddress (cart, view) {
    // nothing to do if shipping addresss id not set
    if (!cart.cartData.shippingAddressId) {
        return
    }
    // get active address by id
    var activeAddress = _.find(
        view.addresses,
        {'addressId': cart.cartData.shippingAddressId}
    )
    // only continue if found
    if (!activeAddress) {
        return
    }
    // set selected flag
    activeAddress.selected = true
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

function submitAddressInfo (req, cart, addresses, view) {
    var session = req.session
    // skip unless this is submit
    if (!req.body.submit) {
        return
    }
    // if an existing address id was posted check to see if it was edited
    if (req.body.selectAddressId) {
        // get select address object by id
        var selectAddress = _.find(
            addresses,
            {'addressId': req.body.selectAddressId}
        )
        // compare address to input
        if (stringify(selectAddress.addressData) === stringify(view.address)) {
            // save the shipping address id on cart
            cart.cartData.shippingAddressId = selectAddress.addressId
            // do not save if exact match
            return
        }
    }
    // attempt to save address
    return addressController.createAddress(newReq({
        body: {
            addressData: view.address,
            addressType: 'shipping',
            confirmAddress: req.body.confirmAddress,
        },
        session: session,
    }))
    // success
    .then(function (address) {
        // copy address data from response to view - it may have been corrected
        objectReplace(view.address, address.addressData)
        // store address id on cart
        cart.cartData.shippingAddressId = address.addressId
        // check if address validation failed
        if (address.addressValidated === '0' && !req.body.confirmAddress) {
            // show confirmation dialog
            view.addressValidateFailed = true
            // mark primary address fields as having errors
            view.validationErrors.streetAndNumber = true
            view.validationErrors.city = true
            view.validationErrors.state = true
            view.validationErrors.zipCode = true
        }
    })
    // error
    .catch(function (err) {
        // if there were validation errors then return those to view
        if (err && err.data && err.data.validationErrors) {
            // add fields with errors to map
            _.merge(view.validationErrors, err.data.validationErrors)
            // add validation error messages to list
            view.addressErrors = view.addressErrors.concat( _.values(err.data.validationErrors) )
        }
        // cannot 
        else {
            log.error(err, session)
        }
    })
}

function submitDeliveryInfo (req, cart, view) {
    var session = req.session
    // get input
    var cartDeliveryDate = cart.cartData.deliveryDate
    var cartZipCode = cart.cartData.zipCode
    var submitDeliveryDate = req.body.deliveryDate
    var submitZipCode = req.body.zipCode
    // do not update unless at least zip code is set
    if (!submitZipCode) {
        return
    }
    // do not update if unchanged
    if (cartDeliveryDate === submitDeliveryDate && cartZipCode === submitZipCode) {
        return
    }
    // make a copy of cart data before performing update
    var cartData = _.cloneDeep(cart.cartData)
    // set new values for zip code and delivery date
    cartData.deliveryDate = submitDeliveryDate
    cartData.zipCode = submitZipCode
    // update the zip code
    return cartController.updateCart(newReq({
        body: {cartData: cartData},
        params: {cartId: cart.cartId},
        session: session,
    }))
    // update success
    .then(function (resCart) {
        // get the new delivery date which may have changed
        var newDeliveryDate = resCart.cartData.deliveryDate
        // set error if delivery date changed
        if (newDeliveryDate !== submitDeliveryDate) {
            // set errors on view
            view.validationErrors.deliveryDate = true
            view.deliveryDateErrors.push('Requested delivery date not available')
        }
        // replace contents of old cart with new cart
        objectReplace(cart, resCart)
    })
    // catch errors
    .catch(function (err) {
        log.error(err, session)
    })
}