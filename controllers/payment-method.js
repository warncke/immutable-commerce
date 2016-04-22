'use strict'

/* npm libraries */
var _ = require('lodash')
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var checkAccessByAccountOrSession = require('../lib/check-access-by-account-or-session')
var conflict = require('../lib/conflict')
var immutable = require('../lib/immutable')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')
var paymentMethodModel = require('../models/payment-method')
var paymentMethodDeleteModel = require('../models/payment-method-delete')

/* public functions */
var paymentMethodController = module.exports = immutable.controller('PaymentMethod', {
    createPaymentMethod: createPaymentMethod,
    deletePaymentMethod: deletePaymentMethod,
    getPaymentMethodById: getPaymentMethodById,
    getPaymentMethods: getPaymentMethods,
})

/**
 * @function createPaymentMethod
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function createPaymentMethod (req) {
    var session = req.session
    // require logged in account to access stored payment methods
    if (!session.accountId) {
        return accessDenied()
    }
    // create payment method
    return paymentMethodModel.createPaymentMethod({
        accountId: session.accountId,
        paymentMethodData: req.body.paymentMethodData,
        session: session,
        store: req.body.store,
    })
}


/**
 * @function deletePaymentMethod
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function deletePaymentMethod (req) {
    var session = req.session
    // get payment method which will do all required validation
    return paymentMethodController.getPaymentMethodById(req)
    // success
    .then(function (paymentMethod) {
        // create delete record
        return paymentMethodDeleteModel.createPaymentMethodDelete({
            paymentMethodId: paymentMethod.paymentMethodId,
            session: session,
        })
    })
}

/**
 * @function getPaymentMethodById
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function getPaymentMethodById (req) {
    var session = req.session
    // require logged in account to access stored payment methods
    if (!session.accountId) {
        return accessDenied()
    }
    // get payment method
    return paymentMethodModel.getPaymentMethodById({
        paymentMethodId: req.params.paymentMethodId,
        session: session,
        // get only payment methods with store flag set
        store: 1,
    })
    // validate access
    .then(function (paymentMethod) {
        return checkAccessByAccountOrSession(paymentMethod, session)
    })
    // success
    .then(function (paymentMethod) {
        // return 404 if not found or deleted
        if (!paymentMethod || paymentMethod.paymentMethodDeleteCreateTime) {
            return notFound()
        }
        // resolve with payment method
        return paymentMethod
    })
}


/**
 * @function getPaymentMethods
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function getPaymentMethods (req) {
    var session = req.session
    // get payment methods with stored flag
    return paymentMethodModel.getPaymentMethodsByAccountId({
        accountId: session.accountId,
        session: session,
        store: 1,
    })
    // success
    .then(function (paymentMethods) {
        // filter out deleted records and get unique
        return getUniquePaymentMethods(
            _.filter(paymentMethods, {paymentMethodDeleteCreateTime: undefined})
        )
    })
}

/* private functions */

/**
 * @function getUniquePaymentMethods
 *
 * @param {array} paymentMethodes - list of paymentMethodes
 *
 * @return {array}
 */
function getUniquePaymentMethods (paymentMethods) {
    // build map of paymentMethodes by unique key
    var paymentMethodsByUniqueKey = {}
    // the payment method most recently marked as default
    var defaultPaymentMethod
    // iterate over paymentMethodes
    for (var i=0; i < paymentMethods.length; i++) {
        var paymentMethod = paymentMethods[i]
        // get unique key
        var uniqueKey = getUniquePaymentMethodKey(paymentMethod)
        // skip invalid data
        if (!uniqueKey) {
            continue
        }
        // if the payment method is set to default then update the
        // most recent default payment method entry and set the default
        // flag to false - at the end only the last payment method with
        // the default flag set should have it true
        if (paymentMethod.default === '1') {
            defaultPaymentMethod = paymentMethod
            paymentMethod.default = false
        }
        else {
            paymentMethod.default = false
        }
        // set the paymentMethod for this unique key overwriting earlier entries
        paymentMethodsByUniqueKey[uniqueKey] = paymentMethod
    }
    // get list of unique payment methods
    var uniquePaymentMethods = _.values(paymentMethodsByUniqueKey)
    // if there is a default payment method then set the flag correctly
    if (defaultPaymentMethod) {
        defaultPaymentMethod.default = true
    }
    // otherwise make the last payment method default
    else if (uniquePaymentMethods.length > 0) {
        uniquePaymentMethods[ uniquePaymentMethods.length - 1 ].default = true
    }
    // return unique payment methods
    return uniquePaymentMethods
}

/**
 * @function getUniquePaymentMethodKey
 *
 * @param {object} paymentMethod
 *
 * @returns {string}
 */
function getUniquePaymentMethodKey (paymentMethod) {
    // require valid data
    if (!(paymentMethod.paymentMethodData.first_six_digits && paymentMethod.paymentMethodData.last_four_digits)) {
        return
    }
    // use BIN (first 6 digits) + last four to identify card
    return paymentMethod.paymentMethodData.first_six_digits + '-' + paymentMethod.paymentMethodData.last_four_digits
}
