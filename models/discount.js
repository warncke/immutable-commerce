'use strict'

/* application libraries */
var convertToBooleanMulti = require('../lib/convert-to-boolean-multi')
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('Discount', {
    createDiscount: createDiscount,
    getDiscountById: getDiscountById,
    getMostRecentDiscountByDiscountCode: getMostRecentDiscountByDiscountCode,
})

/**
 * @function createDiscount
 *
 * @param {string} discountCode - code to activate discount
 * @param {object} discountData
 * @param {string} discountEndTime
 * @param {string} discountStartTime
 * @param {string} discountType
 * @param {string} originalDiscountId - hex id
 * @param {string} parentDiscountId - hex id
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createDiscount (args) {
    // build discount data
    var discount = {
        discountCode: args.discountCode,
        discountCreateTime: args.session.requestTimestamp,
        discountData: stringifyObject(args.discountData),
        discountEndTime: args.discountEndTime,
        discountStartTime: args.discountStartTime,
        discountType: args.discountType,
        originalDiscountId: args.originalDiscountId,
        parentDiscountId: args.parentDiscountId,
        sessionId: args.session.sessionId,
    }
    // create id
    setId(discount, 'discountId', 'originalDiscountId')
    // insert address
    return db('immutable').query(
        'INSERT INTO discount VALUES(UNHEX(:discountId), UNHEX(:originalDiscountId), UNHEX(:parentDiscountId), UNHEX(:sessionId), :discountCode, :discountType, :discountData, :discountStartTime, :discountEndTime, :discountCreateTime)',
        discount,
        undefined,
        args.session
    )
    .then(function (res) {
        // unpack JSON encoded data
        return jsonParseMulti(discount, ['discountData'])
    })
}

/**
 * @function getDiscountById
 *
 * @param {string} discountId - hex id
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getDiscountById (args) {
// get discount by code and optionally date
    return db('immutable').query(
        'SELECT HEX(d.discountId) AS discountId, HEX(d.originalDiscountId) AS originalDiscountId, HEX(d.parentDiscountId) parentDiscountId, HEX(d.sessionId) AS sessionId, d.discountCode, d.discountType, d.discountData, d.discountStartTime, d.discountEndTime, d.discountCreateTime, IF(:requestTimestamp < d.discountStartTime, 1, 0) discountNotYetActive, IF(:requestTimestamp > d.discountEndTime, 1, 0) discountExpired FROM discount d WHERE d.discountId = UNHEX(:discountId) AND d.discountCreateTime <= :requestTimestamp',
        {
            discountId: args.discountId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    )
    .then(formatSingleResponse)
}

/**
 * @function getMostRecentDiscountByDiscountCode
 *
 * @param {string} discountCode - code to activate discount
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMostRecentDiscountByDiscountCode (args) {
    // get discount by code and optionally date
    return db('immutable').query(
        'SELECT HEX(d.discountId) AS discountId, HEX(d.originalDiscountId) AS originalDiscountId, HEX(d.parentDiscountId) parentDiscountId, HEX(d.sessionId) AS sessionId, d.discountCode, d.discountType, d.discountData, d.discountStartTime, d.discountEndTime, d.discountCreateTime, IF(:requestTimestamp < d.discountStartTime, 1, 0) discountNotYetActive, IF(:requestTimestamp > d.discountEndTime, 1, 0) discountExpired FROM discount d LEFT JOIN discount d2 ON d.discountId = d2.parentDiscountId WHERE d2.parentDiscountId IS NULL AND d.discountCode = :discountCode',
        {
            discountCode: args.discountCode,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    )
    .then(formatSingleResponse)
}

/* private functions */

function formatSingleResponse (res) {
    // return undef if no results
    if (!res.length) {
        return
    }
    // convert tinyint to boolean
    convertToBooleanMulti(res, ['discountNotYetActive', 'discountExpired'])
    // parse json data
    jsonParseMulti(res, ['discountData'])
    // return modified record
    return res[0]
}