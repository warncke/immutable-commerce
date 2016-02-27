'use strict'

/* npm libraries */

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
 * @param {string} productId - hex id of original cart
 * @param {string} optionName
 * @param {string} optionValue
 * @param {object} account - request account
 * 
 * @returns {Promise}
 */
function createAccountProductOption (args) {
    // insert product publish
    return db('immutable').query(
        'INSERT INTO `accountProductOption` VALUES(UNHEX(:accountId), UNHEX(:productId), :optionName, :optionValue, :accountProductOptionCreateTime)',
        {
            accountId: args.accountId,
            optionName: args.optionName,
            optionValue: args.optionValue,
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
        'SELECT HEX(accountId) AS accountId, HEX(productId) AS productId, optionName, optionValue, accountProductOptionCreateTime FROM accountProductOption WHERE accountId = UNHEX(:accountId) AND accountProductOptionCreateTime <= :accountProductOptionCreateTime ORDER BY accountProductOptionCreateTime',
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