'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('Address', {
    createAddress: createAddress,
    getAddresses: getAddresses,
    getAddressById: getAddressById,
})

/**
 * @function createAddress
 *
 * @param {string} addressId - hex id of address to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAddress (args) {
    // build address data
    var address = {
        accountId: args.accountId,
        addressCreateTime: args.session.requestTimestamp,
        addressData: stringifyObject(args.addressData),
        addressType: args.addressType,
        sessionId: args.session.sessionId,
    }
    // get address id
    setId(address, 'addressId')
    // insert address
    return db('immutable').query(
        'INSERT INTO address VALUES(UNHEX(:addressId), UNHEX(:accountId), UNHEX(:sessionId), :addressData, :addressType, :addressCreateTime)',
        address,
        undefined,
        args.session
    ).then(function (res) {
        // unpack JSON encoded data
        return jsonParseMulti(address, ['addressData'])
    })
}

/**
 * @function getAddresses
 *
 * @param {string} accountId - optional hex id of account to get addresses for
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getAddresses (args) {
    // insert cart
    return db('immutable').query(
        'SELECT HEX(a.addressId) AS addressId, HEX(a.accountId) AS accountId, HEX(a.sessionId) AS sessionId, addressData, addressType, addressValidated, addressValidateData, addressCreateTime, addressDeleteCreateTime, addressValidateCreateTime FROM address a LEFT JOIN addressDelete ad ON a.addressId = ad.addressId LEFT JOIN addressValidate av ON a.addressId = av.addressId WHERE a.accountId = UNHEX(:accountId) AND a.addressType = IFNULL(:addressType, a.addressType) AND addressCreateTime <= :requestTimestamp AND (addressDeleteCreateTime IS NULL OR addressDeleteCreateTime > :requestTimestamp) ORDER BY addressCreateTime',
        {
            accountId: args.accountId,
            addressType: args.addressType,
            requestTimestamp: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        // unpack JSON encoded data
        return jsonParseMulti(res, ['addressData', 'addressValidateData'])
    })
}

/**
 * @function getAddressById
 *
 * @param {string} addressId - hex id of address to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getAddressById (args) {
    // insert cart
    return db('immutable').query(
        'SELECT HEX(a.addressId) AS addressId, HEX(a.accountId) AS accountId, HEX(a.sessionId) AS sessionId, addressData, addressValidated, addressValidateData, addressCreateTime, addressDeleteCreateTime, addressValidateCreateTime FROM address a LEFT JOIN addressDelete ad ON a.addressId = ad.addressId LEFT JOIN addressValidate av ON a.addressId = av.addressId WHERE a.addressId = UNHEX(:addressId) AND addressCreateTime <= :requestTimestamp',
        {
            addressId: args.addressId,
            requestTimestamp: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.length
            ? jsonParseMulti(res[0], ['addressData', 'addressValidateData'])
            : undefined
    })
}