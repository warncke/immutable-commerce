'use strict'

/* application libraries */
var formatDisplayPriceMulti = require('../../lib/format-display-price-multi')

/* public functions */
module.exports = {
    applyDiscountToCart: applyDiscountToCart,
}

/**
 * @function applyDiscountToCart
 *
 * @param {object} cart - cart controller response
 * @param {object} discount - most recent discount for session
 *
 * @returns {Promise}
 */
function applyDiscountToCart (cart, discount) {
    // get discount amount
    var amount = parseInt(discount.discountData.amount)
    // nothing to do unless valid discount amount
    if (!(amount > 0)) {
        return
    }
    // set active discount on cart
    var activeDiscount = cart.activeDiscount = {
        discountCode: discount.discountCode,
        discountAmount: parseInt(discount.discountData.amount),
    }
    // format prices for display
    formatDisplayPriceMulti(activeDiscount, ['discountAmount'])
}