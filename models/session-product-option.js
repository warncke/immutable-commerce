'use strict'

/* npm libraries */

/* application libraries */

var buildProductOptions = require('../lib/build-product-options')
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('SessionProductOption', {
    createSessionProductOption: createSessionProductOption,
    getSessionProductOptions: getSessionProductOptions,
})

/**
 * @function createSessionProductOption
 *
 * @param {string} productId - hex id of original cart
 * @param {string} optionName
 * @param {string} optionValue
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createSessionProductOption (args) {
    // insert product publish
    return db('immutable').query(
        'INSERT INTO `sessionProductOption` VALUES(UNHEX(:sessionId), UNHEX(:productId), :optionName, :optionValue, :sessionProductOptionCreateTime)',
        {
            optionName: args.optionName,
            optionValue: args.optionValue,
            productId: args.productId,
            sessionId: args.session.originalSessionId,
            sessionProductOptionCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.affectedRows === '1' ? true : false
    })
}

/**
 * @function getSessionProductOptions
 *
 * @param {string} sessionId - hex id of session to get options for
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getSessionProductOptions (args) {
    // get product options
    return db('immutable').query(
        'SELECT HEX(sessionId) AS sessionId, HEX(productId) AS productId, optionName, optionValue, sessionProductOptionCreateTime FROM sessionProductOption WHERE sessionId = UNHEX(:sessionId) AND sessionProductOptionCreateTime <= :sessionProductOptionCreateTime ORDER BY sessionProductOptionCreateTime',
        {
            sessionId: args.session.originalSessionId,
            sessionProductOptionCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return buildProductOptions(res)
    })
}