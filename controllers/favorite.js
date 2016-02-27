'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var favoriteModel = require('../models/favorite')
var immutable = require('../lib/immutable')
var productModel = require('../models/product')

/* public functions */
var favoriteController = module.exports = immutable.controller('Favorite', {
    createFavorite: createFavorite,
    getFavorites: getFavorites,
})

/**
 * @function createFavorite
 *
 * @param {object} args - controller args
 * 
 * @returns {Promise}
 */
function createFavorite (args) {
    var session = args.session
    // require to be logged into account to use favorites
    if (!session.accountId) {
        return accessDenied()
    }
    // get input
    var productId = args.body.productId
    // get product
    return productModel.getProductById({
        productId: productId,
        session: session,
    })
    // validate product then toggle favorite
    .then(function (product) {
        // require valid product
        if (!product) {
            return badRequest('product not found')
        }
        // toggle favorite
        return favoriteModel.createFavorite({
            accountId: session.accountId,
            productId: productId,
            session: session,
        })
    })
    // return updated list of favorites
    .then(function () {
        return favoriteController.getFavorites(args)
    })
}

/**
 * @function getFavorites
 *
 * @param {object} args - controller args
 * 
 * @returns {Promise}
 */
function getFavorites (args) {
    var session = args.session
    // require to be logged into account to use favorites
    if (!session.accountId) {
        return accessDenied()
    }

    return favoriteModel.getFavorites({
        accountId: args.session.accountId,
        session: session,
    })
}