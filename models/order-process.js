'use strict'

/* application libraries */
var convertToBooleanMulti = require('../lib/convert-to-boolean-multi')
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var setId = require('../lib/set-id')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.controller('OrderProcess', {
    createOrderProcess: createOrderProcess,
    createOrderProcessFinish: createOrderProcessFinish,
    getUnprocessedOrderIds: getUnprocessedOrderIds,
})

/**
 * @function createOrderProcess
 *
 * @param {string} orderId
 * @param {integer} orderProcessAttempt
 *
 * @returns {Promise}
 */
function createOrderProcess (args) {
    // build data
    var orderProcessData = {
        orderId: args.orderId,
        orderProcessAttempt: args.orderProcessAttempt,
        orderProcessCreateTime: args.session.requestTimestamp,
        sessionId: args.session.sessionId,
    }
    // set ids
    setId(orderProcessData, 'orderProcessId')
    // insert record
    return db('immutable').query(`
        INSERT INTO orderProcess VALUES(
            UNHEX(:orderProcessId),
            UNHEX(:orderId),
            :orderProcessAttempt,
            UNHEX(:sessionId),
            :orderProcessCreateTime
        )`,
        orderProcessData,
        undefined,
        args.session
    )
    // success
    .then(function () {
        // return data
        return orderProcessData
    })
}

/**
 * @function createOrderProcessFinish
 *
 * @param {object} orderProcessFinishData
 * @param {string} orderProcessId
 * @param {boolean} orderProcessSuccess
 *
 * @returns {Promise}
 */
function createOrderProcessFinish (args) {
    // build data
    var orderProcessFinishData = {
        orderProcessFinishData: stringifyObject(args.orderProcessFinishData),
        orderProcessId: args.orderProcessId,
        orderProcessSuccess: args.orderProcessSuccess ? 1 : 0,
        sessionId: args.session.sessionId,
    }
    // insert record
    return db('immutable').query(`
        INSERT INTO orderProcessFinish VALUES(
            UNHEX(:orderProcessId),
            :orderProcessSuccess,
            :orderProcessFinishData,
            UNHEX(:sessionId),
            :orderProcessCreateTime
        )`,
        orderProcessFinishData,
        undefined,
        args.session
    )
    // success
    .then(function () {
        // return data
        return convertToBooleanMulti(orderProcessFinishData, 'orderProcessSuccess')
    })
}

/**
 * @function getUnprocessedOrderIds
 *
 * @returns {Promise}
 */
function getUnprocessedOrderIds (args) {
    return db('immutable').query(`
        SELECT
            HEX(o.orderId) AS orderId
        FROM \`order\` o
        LEFT JOIN \`order\` o2 ON o2.parentOrderId = o.orderId
        LEFT JOIN orderCancel oc ON o.orderId = oc.orderId
        LEFT JOIN orderProcess op ON o.orderId = op.orderId
        WHERE
            o2.parentOrderId IS NULL
        AND oc.orderCancelId IS NULL
        AND op.orderProcessId IS NULL
        AND o.orderId IS NOT NULL
        `,
        undefined,
        undefined,
        args.session
    )
}