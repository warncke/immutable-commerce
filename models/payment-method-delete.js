'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('PaymentMethodDelete', {
    createPaymentMethodDelete: createPaymentMethodDelete,
})

/**
 * @function createPaymentMethodDelete
 *
 * @param {string} paymentMethodId - payment method hex id
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createPaymentMethodDelete (args) {
    // payment method delete record
    var paymentMethodDelete = {
        paymentMethodDeleteCreateTime: args.session.requestTimestamp,
        paymentMethodId: args.paymentMethodId,
        sessionId: args.session.sessionId,
    }
    // insert payment method delete record
    return db('immutable').query(
        'INSERT INTO paymentMethodDelete VALUES(UNHEX(:paymentMethodId), UNHEX(:sessionId), :paymentMethodDeleteCreateTime)',
        paymentMethodDelete,
        undefined,
        args.session
    )
    // resolve with data on success
    .then(function () {
        return paymentMethodDelete
    })
}