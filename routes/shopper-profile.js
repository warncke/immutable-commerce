'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var shopperProfileController = require('../controllers/shopper-profile')

/* routes */

// get most recent shopperProfile for session/frUid or create new shopperProfile
router.get('/shopper-profile', apiRouteHandler(shopperProfileController.getCurrentShopperProfile))
// get specific shopperProfile by id
router.get('/shopper-profile/:shopperProfileId', apiRouteHandler(shopperProfileController.getShopperProfileById))
// update shopperProfile
router.put('/shopper-profile/:shopperProfileId', apiRouteHandler(shopperProfileController.updateShopperProfile))

module.exports = router
