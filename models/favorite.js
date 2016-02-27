'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('Favorite', {
    createFavorite: createFavorite,
    getFavorites: getFavorites,
})

/**
 * @function createFavorite
 *
 * @param {string} accountId - hex id of logged in user
 * @param {string} productId - hex id of product favorite being toggled
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createFavorite (args) {
    // build favorite data
    var favorite = {
        accountId: args.accountId,
        favoriteCreateTime: args.session.requestTimestamp,
        productId: args.productId,
        toggle: 1,
    }
    // insert favorite
    return db('immutable').query(
        'INSERT INTO favorite VALUES(UNHEX(:accountId), UNHEX(:productId), :toggle, :favoriteCreateTime)',
        favorite,
        undefined,
        args.session
    ).then(function () {
        // return data on success
        return favorite
    })
}

/**
 * @function getFavorites
 *
 * @param {string} accountId - hex id of logged in user
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getFavorites (args) {
    // select favorites by account id
    return db('immutable').query(
        'SELECT HEX(productId) AS productId, SUM(toggle) % 2 AS toggle FROM favorite WHERE accountId = UNHEX(:accountId) AND favoriteCreateTime <= :requestTimestamp GROUP BY accountId, productId',
        {
            accountId: args.accountId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        return buildFavorites(res)
    })
}

/**
 * @function buildFavorites
 *
 * @param {array} res - database response
 *
 * @returns {object} favorites
 */
function buildFavorites (res) {
    // map of favorite product ids and current favorite status
    var favorites = {}
    // iterate over favorite entries
    for (var i=0; i < res.length; i++) {
        var favorite = res[i]
        // convert database value of 0|1 to bool
        favorites[favorite.productId] = favorite.toggle === '1' ? true : false
    }
    return favorites
}