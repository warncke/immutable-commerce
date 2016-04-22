'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('ShopperProfile', {
    createShopperProfile: createShopperProfile,
    getCurrentShopperProfile: getCurrentShopperProfile,
    getShopperProfileById: getShopperProfileById,
    getMostRecentShopperProfileByOriginalShopperProfileId: getMostRecentShopperProfileByOriginalShopperProfileId
})

/**
 * @function createShopperProfile
 *
 * @param {string} frUid - current frUid
 * @param {object} data - data to store with shopperProfile
 * @param {string} originalShopperProfileId - hex id of original shopperProfile
 * @param {string} parentShopperProfileId - hex id of parent shopperProfile being modified
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createShopperProfile (args) {
    // build shopperProfile data
    var shopperProfile = {
        originalShopperProfileId: args.originalShopperProfileId,
        parentShopperProfileId: args.parentShopperProfileId,
        frUid: args.frUid,
        sessionId: args.session.sessionId,
        data: stringifyObject(args.data),
        shopperProfileCreateTime: args.session.requestTimestamp,
    }
    // set id
    setId(shopperProfile, 'shopperProfileId', 'originalShopperProfileId')
    // insert shopperProfile
    return db('immutable').query(`
        INSERT INTO shopperProfile
        (shopperProfileId, originalShopperProfileId, parentShopperProfileId, frUid, sessionId, data, shopperProfileCreateTime)
        VALUES(
            UNHEX(:shopperProfileId),
            UNHEX(:originalShopperProfileId),
            UNHEX(:parentShopperProfileId),
            :frUid,
            UNHEX(:sessionId),
            :data,
            :shopperProfileCreateTime
        )`,
        shopperProfile,
        undefined,
        args.session
    ).then(function () {
        // deserialize data
        return jsonParseMulti(shopperProfile, 'data')
    })
}

/**
 * @function getCurrentShopperProfile
 *
 * @param {string} frUid - current frUid
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getCurrentShopperProfile (args) {
    return getShopperProfileByFrUid({
        frUid: args.frUid,
        session: args.session
    }).then(function (res) {
        // Check if a profile was found
        if (typeof res !== 'undefined') {
            // Profile found, return it
            return res;
        }
        // No profile found for frUid, create a new one with no data
        return createShopperProfile({
            frUid: args.frUid,
            data: {},
            session: args.session
        });
    });
}

/**
 * @function getShopperProfileByFrUid
 *
 * @param {string} frUid - current frUid
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getShopperProfileByFrUid (args) {
    return db('immutable').query(
        // select the most recent shopperProfile associated with the session
        `SELECT
            HEX(t.shopperProfileId) AS shopperProfileId,
            HEX(t.originalShopperProfileId) AS originalShopperProfileId,
            HEX(t.parentShopperProfileId) AS parentShopperProfileId,
            t.frUid,
            HEX(t.sessionId) AS sessionId,
            t.data,
            t.shopperProfileCreateTime
        FROM shopperProfile t
        LEFT JOIN shopperProfile t2 ON t.shopperProfileId = t2.parentShopperProfileId
        WHERE t2.shopperProfileId IS NULL AND t.frUid = :frUid
        ORDER BY t.shopperProfileCreateTime DESC LIMIT 1`,
        {
            requestTimestamp: args.session.requestTimestamp,
            frUid: args.frUid
        },
        undefined,
        args.session
    ).then(function (res) {
        // return shopperProfile if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })
}

/**
 * @function getShopperProfileById
 *
 * @param {string} shopperProfileId - hex id of parent shopperProfile
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getShopperProfileById (args) {
    // select shopperProfile by id
    return db('immutable').query(
        `SELECT
            HEX(t.shopperProfileId) AS shopperProfileId,
            HEX(t.originalShopperProfileId) AS originalShopperProfileId,
            HEX(t.parentShopperProfileId) AS parentShopperProfileId,
            t.frUid,
            HEX(t.sessionId) AS sessionId,
            t.data,
            t.shopperProfileCreateTime
        FROM shopperProfile t
        WHERE t.shopperProfileId = UNHEX(:shopperProfileId) AND t.shopperProfileCreateTime <= :requestTimestamp`,
        {
            shopperProfileId: args.shopperProfileId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return shopperProfile if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })
}

/**
 * @function getShopperProfileByOriginalShopperProfileId
 *
 * @param {string} originalShopperProfileId - hex id of parent shopperProfile
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMostRecentShopperProfileByOriginalShopperProfileId (args) {
    // select shopperProfile by id
    return db('immutable').query(
        `SELECT
            HEX(t.shopperProfileId) AS shopperProfileId,
            HEX(t.originalShopperProfileId) AS originalShopperProfileId,
            HEX(t.parentShopperProfileId) AS parentShopperProfileId,
            t.frUid,
            HEX(t.sessionId) AS sessionId,
            t.data,
            t.shopperProfileCreateTime
        FROM shopperProfile t
        LEFT JOIN shopperProfile t2 ON t.shopperProfileId = t2.parentShopperProfileId
        WHERE t2.shopperProfileId IS NULL AND t.originalShopperProfileId = UNHEX(:originalShopperProfileId)
        ORDER BY t.shopperProfileCreateTime DESC LIMIT 1`,
        {
            originalShopperProfileId: args.originalShopperProfileId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return shopperProfile if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })

}
