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
        favoriteCreateTime: args.session.req.requestTimestamp,
        productId: args.productId,
        toggle: 1,
    }
    // insert favorite
    return db('immutable').query(
        'INSERT INTO favorite VALUES(:accountId, :productId, :toggle, :favoriteCreateTime)',
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
        'SELECT HEX(productId), SUM(toggle) % 2 AS toggle FROM favorite WHERE accountId = UNHEX(:accountId) AND favoriteCreateTime <= :requestTimestamp',
        {
            accountId: args.accountId,
            requestTimestamp: args.session.req.requestTimestamp
        },
        undefined,
        args.session
    )
}