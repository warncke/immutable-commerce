'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('AddressValidate', {
    createAddressValidate: createAddressValidate,
})

/**
 * @function createAddressValidate
 *
 * @param {string} addressId - hex id of address to get
 * @param {bool} addressValidated - 0 | 1
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAddressValidate (args) {
    // build address validate record
    var addressValidate = {
        addressId: args.addressId,
        addressValidated: args.addressValidated ? 1 : 0,
        addressValidateCreateTime: args.session.requestTimestamp,
        addressValidateData: stringifyObject(args.addressValidateData),
    }
    // insert address validate record
    return db('immutable').query(
        'INSERT INTO addressValidate VALUES(UNHEX(:addressId), :addressValidated, :addressValidateData, :addressValidateCreateTime)',
        addressValidate,
        undefined,
        args.session
    )
    // return record on success
    .then(function (res) {
        return jsonParseMulti(addressValidate, 'addressValidateData')
    })
}