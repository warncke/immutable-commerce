'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('PaymentMethodTransaction', {
    createPaymentMethodTransaction: createPaymentMethodTransaction,
    createPaymentMethodTransactionFinish: createPaymentMethodTransactionFinish,
    getPaymentMethodTransactionsByOrderId: getPaymentMethodTransactionsByOrderId,
})

/**
 * @function createPaymentMethodTransaction
 *
 * @param {string} accountId - hex id of account
 * @param {string} orderId - hex id of order
 * @param {string} paymentMethodId - hex id of payment method
 * @param {string} paymentMethodTransactionAmount - optional decimal transaction amount
 * @param {object} paymentMethodTransactionData - optional transaction data
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createPaymentMethodTransaction (args) {
    // build data
    var paymentMethodTransaction = {
        accountId: args.accountId,
        orderId: args.orderId,
        paymentMethodId: args.paymentMethodId,
        paymentMethodTransactionAmount: args.paymentMethodTransactionAmount,
        paymentMethodTransactionData: stringifyObject(args.paymentMethodTransactionData),
        paymentMethodTransactionType: args.paymentMethodTransactionType,
        sessionId: args.session.sessionId,
        paymentMethodTransactionCreateTime: args.session.requestTimestamp,
    }
    // get id
    setId(paymentMethodTransaction, 'paymentMethodTransactionId')
    // insert transaction
    return db('immutable').query(`
        INSERT INTO paymentMethodTransaction VALUES(
            UNHEX(:paymentMethodTransactionId),
            UNHEX(:accountId),
            UNHEX(:orderId),
            UNHEX(:paymentMethodId),
            UNHEX(:sessionId),
            :paymentMethodTransactionAmount,
            :paymentMethodTransactionData,
            :paymentMethodTransactionType,
            :paymentMethodTransactionCreateTime
        )`,
        paymentMethodTransaction,
        undefined,
        args.session
    )
    .then(function () {
        // deserialize data
        return jsonParseMulti(paymentMethodTransaction, 'paymentMethodTransactionData')
    })
}

/**
 * @function createPaymentMethodTransactionFinish
 *
 * @param {string} paymentMethodId - hex id of payment method
 * @param {bool} paymentMethodTransactionSuccess - was transaction successful
 * @param {object} paymentMethodTransactionFinishData - optional transaction data
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
 function createPaymentMethodTransactionFinish (args) {
    // build data
    var paymentMethodTransactionFinish = {
        paymentMethodTransactionId: args.paymentMethodTransactionId,
        paymentMethodTransactionSuccess: args.paymentMethodTransactionSuccess ? 1 : 0,
        paymentMethodTransactionFinishData: stringifyObject(args.paymentMethodTransactionFinishData),
        paymentMethodTransactionFinishCreateTime: args.session.requestTimestamp,
    }
    // insert transaction finish
    return db('immutable').query(`
        INSERT INTO paymentMethodTransactionFinish VALUES(
            UNHEX(:paymentMethodTransactionId),
            :paymentMethodTransactionSuccess,
            :paymentMethodTransactionFinishData,
            :paymentMethodTransactionFinishCreateTime
        )`,
        paymentMethodTransactionFinish,
        undefined,
        args.session
    ).then(function () {
        // deserialize data
        return jsonParseMulti(paymentMethodTransactionFinish, 'paymentMethodTransactionFinishData')
    })
}

/**
 * @function getPaymentMethodTransactionsByOrderId
 *
 * @param {string} orderId - hex id of order
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getPaymentMethodTransactionsByOrderId (args) {
    return db('immutable').query(`
        SELECT
            HEX(pmt.paymentMethodTransactionId) AS paymentMethodTransactionId,
            HEX(pmt.accountId) AS accountId,
            HEX(pmt.orderId) AS orderId,
            HEX(pmt.paymentMethodId) AS paymentMethodId,
            HEX(pmt.sessionId) AS sessionId,
            pmt.paymentMethodTransactionAmount,
            pmt.paymentMethodTransactionData,
            pmt.paymentMethodTransactionType,
            pmt.paymentMethodTransactionCreateTime,
            pmtf.paymentMethodTransactionSuccess,
            pmtf.paymentMethodTransactionFinishData,
            pmtf.paymentMethodTransactionFinishCreateTime
        FROM paymentMethodTransaction pmt
   LEFT JOIN paymentMethodTransactionFinish pmtf
          ON pmt.paymentMethodTransactionId = pmtf.paymentMethodTransactionId
       WHERE pmt.orderId = :orderId
        `,
        {orderId: args.orderId},
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        // deserialize data
        return jsonParseMulti(res, [
            'paymentMethodTransactionData',
            'paymentMethodTransactionFinishData'
        ])
    })
}