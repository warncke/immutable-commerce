'use strict'

/* npm libraries */

/* application libraries */
var badRequest = require('../lib/bad-request')
var discountExtension = require('../extensions/discount/discount')
var discountModel = require('../models/discount')
var immutable = require('../lib/immutable')
var notFound = require('../lib/not-found')
var sessionDiscountModel = require('../models/session-discount')

/* public functions */
var discountController = module.exports = immutable.controller('Discount', {
    createSessionDiscount: createSessionDiscount,
    deleteSessionDiscount: deleteSessionDiscount,
    getSessionDiscount: getSessionDiscount,
})

/**
 * @function createSessionDiscount
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function createSessionDiscount (req) {
    var session = req.session
    // get input
    var discountCode = req.body.discountCode || req.query.discountCode
    // lookup discount code
    return discountModel.getMostRecentDiscountByDiscountCode({
        discountCode: discountCode,
        session: session,
    })
    // return error unless discount code found
    .then(requireValidDiscount)
    // create session discount entry
    .then(function (discount) {
        return sessionDiscountModel.createSessionDiscount({
            discountId: discount.discountId,
            session: session,
        })
        // success
        .then(function (sessionDiscount) {
            // add discount data for return
            sessionDiscount.discount = discount
            // resolve
            return sessionDiscount
        })
    })
}

/**
 * @function deleteSessionDiscount
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function deleteSessionDiscount (req) {
    var session = req.session
    // insert session discount record with null discount id
    // this makes the active discount null since the model always
    // reads the most recent
    return sessionDiscountModel.createSessionDiscount({
        session: session,
    })
}

/**
 * @function getSessionDiscount
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getSessionDiscount (req) {
    var session = req.session
    // get most recent discount for session
    return sessionDiscountModel.getMostRecentSessionDiscount({
        session: session,
    })
    // success
    .then(function (sessionDiscount) {
        // if no session discount return not found
        if (!(sessionDiscount && sessionDiscount.discountId)) {
            return notFound()
        }
        // get discount
        return discountModel.getDiscountById({
            discountId: sessionDiscount.discountId,
            session: session,
        })
        // success
        .then(function (discount) {
            // add discount data for return
            sessionDiscount.discount = discount
            // resolve
            return sessionDiscount
        })
    })
}

/* private functions */

function requireValidDiscount (discount) {
    // discount must exist
    if (!discount) {
        return badRequest('discount code not found')
    }
    // discount expired
    if (discount.discountExpired) {
        return badRequest('discount expired', discount)
    }
    // discount not yet active
    if (discount.discountNotYetActive) {
        return badRequest('discount not yet active', discount)
    }
    // discount type must be implemented
    if (!discountExtension.discountType(discount.discountType)) {
        return badRequest('unsupported discount type', discount)
    }
    // valid discount
    return discount
}