'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('PaymentMethod', {
    createPaymentMethod: createPaymentMethod,
    getPaymentMethodById: getPaymentMethodById,
    getPaymentMethodsByAccountId: getPaymentMethodsByAccountId,
})

/**
 * @function createPaymentMethod
 *
 * @param {string} accountId - account hex id
 * @param {object} paymentMethodData
 * @param {object} session - request session
 * @param {bool} store - shopper requested card to be stored
 *
 * @returns {Promise}
 */
function createPaymentMethod (args) {
    // build payment method data
    var paymentMethod = {
        accountId: args.accountId,
        default: args.default ? 1 : 0,
        paymentMethodCreateTime: args.session.requestTimestamp,
        paymentMethodData: stringifyObject(args.paymentMethodData),
        sessionId: args.session.sessionId,
        store: args.store ? 1 : 0,
    }
    // do not allow default flag to be set unless store is set
    if (paymentMethod.store === 0) {
        paymentMethod.default = 0
    }
    // get payment method id
    setId(paymentMethod, 'paymentMethodId')
    // insert address
    return db('immutable').query(
        'INSERT INTO paymentMethod VALUES(UNHEX(:paymentMethodId), UNHEX(:accountId), UNHEX(:sessionId), :default, :store, :paymentMethodData, :paymentMethodCreateTime)',
        paymentMethod,
        undefined,
        args.session
    ).then(function (res) {
        // unpack JSON encoded data
        return jsonParseMulti(paymentMethod, 'paymentMethodData')
    })
}

/**
 * @function getPaymentMethodById
 *
 * @param {string} paymentMethodId - payment method hex id
 * @param {object} session - request session
 * @param {string} store - select payment methods by store value
 *
 * @returns {Promise}
 */
function getPaymentMethodById (args) {
    return db('immutable').query(
        'SELECT HEX(pm.paymentMethodId) AS paymentMethodId, HEX(pm.accountId) AS accountId, HEX(pm.sessionId) AS sessionId, pm.default, pm.store, pm.paymentMethodData, pm.paymentMethodCreateTime, HEX(pmd.sessionId) AS paymentMethodDeleteSessionId, pmd.paymentMethodDeleteCreateTime FROM paymentMethod pm LEFT JOIN paymentMethodDelete pmd ON pm.paymentMethodId = pmd.paymentMethodId WHERE pm.paymentMethodId = UNHEX(:paymentMethodId) AND pm.store = IFNULL(:store, pm.store) AND pm.paymentMethodCreateTime <= :requestTimestamp',
        {
            paymentMethodId: args.paymentMethodId,
            requestTimestamp: args.session.requestTimestamp,
            store: args.store,
        },
        undefined,
        args.session
    ).then(function (res) {
        // unpack JSON encoded data
        return res.length ? jsonParseMulti(res[0], 'paymentMethodData') : undefined
    })
}

/**
 * @function getPaymentMethodsByAccountId
 *
 * @param {string} accountId - account hex id
 * @param {object} session - request session
 * @param {string} store - select payment methods by store value
 *
 * @returns {Promise}
 */
function getPaymentMethodsByAccountId (args) {
    return db('immutable').query(
        'SELECT HEX(pm.paymentMethodId) AS paymentMethodId, HEX(pm.accountId) AS accountId, HEX(pm.sessionId) AS sessionId, pm.default, pm.store, pm.paymentMethodData, pm.paymentMethodCreateTime, HEX(pmd.sessionId) AS paymentMethodDeleteSessionId, pmd.paymentMethodDeleteCreateTime FROM paymentMethod pm LEFT JOIN paymentMethodDelete pmd ON pm.paymentMethodId = pmd.paymentMethodId WHERE pm.accountId = UNHEX(:accountId) AND pm.store = IFNULL(:store, pm.store) AND pm.paymentMethodCreateTime <= :requestTimestamp ORDER BY pm.paymentMethodCreateTime',
        {
            accountId: args.accountId,
            requestTimestamp: args.session.requestTimestamp,
            store: args.store,
        },
        undefined,
        args.session
    ).then(function (res) {
        // unpack JSON encoded data
        return jsonParseMulti(res, 'paymentMethodData')
    })
}