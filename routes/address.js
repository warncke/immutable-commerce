'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var addressController = require('../controllers/address')

/* routes */

// create address
router.post('/address', apiRouteHandler(addressController.createAddress))
// get addresses for session and/or account
router.get('/address', apiRouteHandler(addressController.getAddresses))
// get specifc address by id
router.get('/address/:addressId', apiRouteHandler(addressController.getAddressById))
// delete address
router.delete('/address/:addressId', apiRouteHandler(addressController.deleteAddress))

module.exports = router