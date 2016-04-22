'use strict'

/* npm libraries */
var _ = require('lodash')

/* application libraries */
var accessDenied = require('../lib/access-denied')
var addressModel = require('../models/address')
var addressDeleteModel = require('../models/address-delete')
var addressValidateModel = require('../models/address-validate')
var badRequest = require('../lib/bad-request')
var checkAccessByAccountOrSession = require('../lib/check-access-by-account-or-session')
var conflict = require('../lib/conflict')
var immutable = require('../lib/immutable')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')

/* public functions */
var addressController = module.exports = immutable.controller('Address', {
    createAddress: createAddress,
    deleteAddress: deleteAddress,
    getAddresses: getAddresses,
    getAddressById: getAddressById,
})

/**
 * @function createAddress
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function createAddress (req) {
    var session = req.session
    // shared variables
    var address
    // create addresses
    return addressModel.createAddress({
        accountId: session.accountId,
        addressData: req.body.addressData,
        addressType: req.body.addressType,
        session: session,
    })
    // after address create check address validation data
    .then(function (resAddress) {
        address = resAddress
        // get address validate data, possibley set by extension
        var addressValidate = req.body.addressValidate
        // return unless address validation data was set
        if (!addressValidate) {
            return
        }
        // attempt to create address validate record
        return addressValidateModel.createAddressValidate({
            addressId: address.addressId,
            addressValidated: addressValidate.addressValidated,
            addressValidateData: addressValidate.addressValidateData,
            session: session,
        })
        // add address validate record to response
        .then(function (addressValidate) {
            address.addressValidate = addressValidate
        })
        // catch errors
        .catch(function (err) {
            // continue even if validate insert fails
        })
    })
    .then(function () {
        // set address id in req params for next controller
        req.params.addressId = address.addressId
        // return newly create address
        return addressController.getAddressById(req)
    })
}

/**
 * @function deleteAddress
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function deleteAddress (req) {
    var session = req.session
    // load and validate address
    return addressController.getAddressById(req)
    // create delete record if address loaded
    .then(function (address) {
        return addressDeleteModel.createAddressDelete({
            addressId: req.params.addressId,
            session: session,
        })
    })
    // catch duplicate key errors
    .catch(function (err) {
        if (isDuplicate(err)) {
            return badRequest('address already deleted')
        }
        else {
            return Promise.reject(err)
        }
    })
    // reload address reocrd
    .then(function () {
        return addressController.getAddressById(req)
    })
}

/**
 * @function getAddresses
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function getAddresses (req) {
    var session = req.session
    // get addresses
    return addressModel.getAddresses({
        accountId: session.accountId,
        addressType: req.query.addressType,
        session: session,
    })
    // success
    .then(function (addresses) {
        return getUniqueAddresses(addresses)
    })
}

/**
 * @function getAddressById
 *
 * @param {object} req - express request
 *
 * @returns {Promise}
 */
function getAddressById (req) {
    var session = req.session
    // try to load address
    return addressModel.getAddressById({
        addressId: req.params.addressId,
        session: session,
    })
    // validate access
    .then(function (address) {
        return checkAccessByAccountOrSession(address, session)
    })
}

/* private functions */

/**
 * @function getUniqueAddresses
 *
 * @param {array} addresses - list of addresses
 *
 * @return {array}
 */
function getUniqueAddresses (addresses) {
    // build map of addresses by unique key
    var addressesByUniqueKey = {}
    // iterate over addresses
    for (var i=0; i < addresses.length; i++) {
        var address = addresses[i]
        // get unique key that is used for determining that address
        // is for the same physical location - the list retured should
        // be the newest address for any particular physical location
        // changes to ancillary data like delivery instructions and
        // phone numbers should not result in duplicate address entries
        var uniqueKey = getUniqueAddressKey(address)
        // set the address for this unique key overwriting earlier entries
        addressesByUniqueKey[uniqueKey] = address
    }
    // return addresses
    return _.values(addressesByUniqueKey)
}

/**
 * @function getUniqueAddressKey
 *
 * @param {object} address
 *
 * @returns {string}
 */
function getUniqueAddressKey (address) {
    // get digits from street and zip
    var digits = address.addressData.streetAndNumber.replace(/\D/g, '')
    var zipCode = address.addressData.zipCode.replace(/\D/g, '')
    // create key from address digits
    return digits + '-' + zipCode
}