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
    // call controller function
    return favoriteController.getFavorites(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}

function createFavorite (req, res, next) {
    // call controller function
    return favoriteController.createFavorite(req)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}