'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var favoriteController = require('../controllers/favorite')
var immutable = require('../lib/immutable')

/* routes */

// get list of favorites
router.get('/favorite', getFavorites)
// toggle (add/remove) favorite 
router.put('/favorite/:productId', createFavorite)

module.exports = router

/* route handlers */

function getFavorites (req, res, next) {
   // set next callback for current context
    req.session.next = next
    // call controller function
    return favoriteController.getFavorites(req.session)
}

function createFavorite (req, res, next) {
    // set next callback for current context
    req.session.next = next
    // call controller function
    return favoriteController.createFavorite(req.session)
}