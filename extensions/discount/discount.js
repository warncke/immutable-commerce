'use strict'

/* discount type implementations */
var discountFixed = require('./fixed')
var immutable = require('../../lib/immutable')

// available discount types
var discountTypes = {
    fixed: discountFixed,
}

/* public functions */
var discount = module.exports = immutable.extension('Discount', {
    applyDiscountToCart: applyDiscountToCart,
})
// discountType is helper function, does not conform to module interface
// and does not need to be logged
module.exports.discountType = discountType

/* bind extensions */
immutable.after('FreshrealmExtension.setProductPrice', discount.applyDiscountToCart)

/* public functions */

/**
 * @function applyDiscountToCart
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function applyDiscountToCart (args) {
    // get original response
    var res = args.args.args.res
    // get discount
    var discount = res.sessionDiscount && res.sessionDiscount.discount
    // return unless session has a discount
    if (!discount) {
        return
    }
    // get implementation for discount type
    var discountTypeImplementation = discountType(discount.discountType)
    // if type is not valid then nothing to do
    if (!discountType) {
        return
    }
    // execute implementation function for this discount type
    // this modifies the response, which is bad and should be fixed
    discountTypeImplementation.applyDiscountToCart(res, discount)
}

/**
 * @function discountType
 *
 * @param {string} discountType - express request
 *
 * @returns {object} - discount implementation
 */
function discountType (discountType) {
    return discountTypes[discountType]
}