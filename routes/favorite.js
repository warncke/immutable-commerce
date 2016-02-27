'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var argsFromReq = require('../lib/args-from-req')
var favoriteController = require('../controllers/favorite')
var immutable = require('../lib/immutable')

/* routes */

// get list of favorites
router.get('/favorite', getFavorites)
// toggle (add/remove) favorite 
router.put('/favorite', createFavorite)

module.exports = router

/* route handlers */

function getFavorites (req, res, next) {
    var args = argsFromReq(req)
    // call controller function
    return favoriteController.getFavorites(args)
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
    var args = argsFromReq(req)
    // call controller function
    return favoriteController.createFavorite(args)
    // handle response
    .then(function (data) {
        res.send(data)
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}