'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('AddressDelete', {
    createAddressDelete: createAddressDelete,
})

/**
 * @function createAddressDelete
 *
 * @param {string} addressId - hex id of address to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAddressDelete (args) {
    // insert address delete record
    return db('immutable').query(
        'INSERT INTO addressDelete VALUES(UNHEX(:addressId), UNHEX(:sessionId), :addressDeleteCreateTime)',
        {
            addressId: args.addressId,
            addressDeleteCreateTime: args.session.requestTimestamp,
            sessionId: args.session.sessionId,
        },
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        return res.info.affectedRows === '1' ? true : false
    })
}