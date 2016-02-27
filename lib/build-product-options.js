'use strict'

/* public functions */
module.exports = buildProductOptions

/**
 * @function buildProductOptions
 * 
 * @param {array} res - database response object
 *
 * @returns {object} product options data
 */
function buildProductOptions (res) {
    // map of product options by product id
    var productOptions = {}
    // iterate over result rows
    for (var i=0; i < res.length; i++) {
        var productOption = res[i]
        // create new entry for product id if it does not already exist
        if (!productOptions[productOption.productId]) {
            // create map of option names and values for each product
            productOptions[productOption.productId] = {}
        }
        // set the option name and value - result must be ordered by date
        // so older values are overwritten by newer ones
        productOptions[productOption.productId][productOption.optionName] = productOption.optionValue
    }

    return productOptions
}