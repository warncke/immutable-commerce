'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('AddressConfirm', {
    createAddressConfirm: createAddressConfirm,
})

/**
 * @function createAddressConfirm
 *
 * @param {string} addressId - hex id of address to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAddressConfirm (args) {
    // insert address confirm record
    return db('immutable').query(
        'INSERT INTO addressConfirm VALUES(UNHEX(:addressId), UNHEX(:sessionId), :addressConfirmCreateTime)',
        {
            addressId: args.addressId,
            addressConfirmCreateTime: args.session.requestTimestamp,
            sessionId: args.session.sessionId,
        },
        undefined,
        args.session
    )
}