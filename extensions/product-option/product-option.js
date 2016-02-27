'use strict'

/* application libraries */
var accountProductOptionModel = require('../../models/account-product-option')
var immutable = require('../../lib/immutable')
var sessionProductOptionModel = require('../../models/session-product-option')

/* public functions */
var productOption = module.exports = immutable.extension('ProductOption', {
    copyAccountProductOptionsToSession: copyAccountProductOptionsToSession,
})

/* bind extensions */
immutable.after('SessionModel.createSession', productOption.copyAccountProductOptionsToSession)

/**
 * @function copyAccountProductOptionsToSession
 * 
 * @param {object} args
 */
function copyAccountProductOptionsToSession (args) {
    var session = args.session
    // get account id from call to create session
    var accountId = args.args.accountId
    // if not account then do nothing
    if (!accountId) {
        return
    }
    // get product options for account
    var accountProductOptionsPromise = accountProductOptionModel.getAccountProductOptions({
        accountId: accountId,
        session: session,
    })
    // get product options for session
    var sessionProductOptionsPromise = sessionProductOptionModel.getSessionProductOptions({
        session: session,
    })
    // wait for promises to resolve
    Promise.all([
        accountProductOptionsPromise,
        sessionProductOptionsPromise,
    ])
    // copy all product options to session
    .then(function (res) {
        var accountProductOptions = res[0]
        var sessionProductOptions = res[1]
        // get product ids for all account product options
        var productIds = Object.keys(accountProductOptions)
        // iterate over products with options set on account
        for (var i=0; i < productIds.length; i++) {
            var productId = productIds[i]
            var productOptions = accountProductOptions[productId]
            // if session already has options set for this product then
            // assume that these are correct and do not modify
            if (sessionProductOptions[productId]) {
                continue
            }
            // list of promises for session options to be created
            var createSessionProductOptionPromises = []
            // get all product option names
            var optionNames = Object.keys(productOptions)
            // iterate over product option names
            for (var j=0; j < optionNames.length; j++) {
                var optionName = optionNames[j]
                var optionValue = productOptions[optionName]
                // create product option
                var createSessionProductOptionPromise = sessionProductOptionModel.createSessionProductOption({
                    optionName: optionName,
                    optionValue: optionValue,
                    productId: productId,
                    session: session,
                })
                // add promise to list
                createSessionProductOptionPromises.push(createSessionProductOptionPromise)
            }
            // wait for all production option creates to finish
            return Promise.all(createSessionProductOptionPromises)
        }
    })
}