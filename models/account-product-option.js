'use strict'

/* application libraries */
var buildProductOptions = require('../lib/build-product-options')
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('AccountProductOption', {
    createAccountProductOption: createAccountProductOption,
    getAccountProductOptions: getAccountProductOptions,
})

/**
 * @function createAccountProductOption
 *
 * @param {object} accountId - hex account id
 * @param {string} optionName
 * @param {string} optionValue
 * @param {string} originalProductId - hex id of original product
 * @param {string} productId - hex id of product
 * 
 * @returns {Promise}
 */
function createAccountProductOption (args) {
    // insert product publish
    return db('immutable').query(
        'INSERT INTO `accountProductOption` VALUES(UNHEX(:accountId), UNHEX(:productId), UNHEX(:originalProductId), :optionName, :optionValue, :accountProductOptionCreateTime)',
        {
            accountId: args.accountId,
            optionName: args.optionName,
            optionValue: args.optionValue,
            originalProductId: args.originalProductId,
            productId: args.productId,
            accountProductOptionCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.affectedRows === '1' ? true : false
    })
}

/**
 * @function getAccountProductOptions
 *
 * @param {string} accountId - hex id of account to get options for
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getAccountProductOptions (args) {
    // get product options
    return db('immutable').query(
        'SELECT HEX(accountId) AS accountId, HEX(originalProductId) AS productId, optionName, optionValue, accountProductOptionCreateTime FROM accountProductOption WHERE accountId = UNHEX(:accountId) AND accountProductOptionCreateTime <= :accountProductOptionCreateTime ORDER BY accountProductOptionCreateTime',
        {
            accountId: args.accountId,
            accountProductOptionCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.sessionId
    ).then(function (res) {
        return buildProductOptions(res)
    })
}