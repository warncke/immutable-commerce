'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('SessionDiscount', {
    createSessionDiscount: createSessionDiscount,
    getMostRecentSessionDiscount: getMostRecentSessionDiscount,
})

/**
 * @function createSessionDiscount
 *
 * @param {string} discountId - hex id of discount
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createSessionDiscount (args) {
    var sessionDiscount = {
        discountId: args.discountId,
        sessionId: args.session.sessionId,
        sessionDiscountCreateTime: args.session.requestTimestamp,
    }
    // insert
    return db('immutable').query(
        'INSERT INTO sessionDiscount VALUES(UNHEX(:discountId), UNHEX(:sessionId), :sessionDiscountCreateTime)',
        sessionDiscount,
        undefined,
        args.session
    ).then(function () {
        return sessionDiscount
    })
}

/**
 * @function getMostRecentSessionDiscount
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getMostRecentSessionDiscount (args) {
    // get session discount
    return db('immutable').query(
        'SELECT HEX(discountId) AS discountId, HEX(sessionId) AS sessionId, sessionDiscountCreateTime FROM sessionDiscount WHERE sessionId = UNHEX(:sessionId) AND sessionDiscountCreateTime <= :requestTimestamp ORDER BY sessionDiscountCreateTime DESC LIMIT 1',
        {
            requestTimestamp: args.session.requestTimestamp,
            sessionId: args.session.sessionId,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.length ? res[0] : undefined
    })
}