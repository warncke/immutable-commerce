'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var favoriteController = require('../controllers/favorite')

/* routes */

// get list of favorites
router.get('/favorite', apiRouteHandler(favoriteController.getFavorites))
// toggle (add/remove) favorite 
router.post('/favorite', apiRouteHandler(favoriteController.createFavorite))

module.exports = router