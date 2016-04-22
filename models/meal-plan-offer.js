'use strict'

/* application libraries */
var db = require('../lib/database')
var idInQuery = require('../lib/id-in-query')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
var mealPlanOfferModel = immutable.model('MealPlanOffer', {
    createMealPlanOffer: createMealPlanOffer,
    deleteMealPlanOffer: deleteMealPlanOffer,
    publishMealPlanOffer: publishMealPlanOffer,
    getMealPlanOffers: getMealPlanOffers,
    getMealPlanOfferById: getMealPlanOfferById,
    getMealPlanOffersById: getMealPlanOffersById,
    getMostRecentMealPlanOfferByOriginalMealPlanOfferId: getMostRecentMealPlanOfferByOriginalMealPlanOfferId
})
module.exports = mealPlanOfferModel;

/**
 * @function createMealPlanOffer
 *
 * @param {string} originalMealPlanOfferId - hex id of original mealPlanOffer
 * @param {string} parentMealPlanOfferId - hex id of original mealPlanOffer
 * @param {object} data - mealPlanOffer data
 * @param {integer} sortWeight - used for sorting of offers in ascending order
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createMealPlanOffer (args) {
    // build mealPlanOffer data
    var mealPlanOffer = {
        originalMealPlanOfferId: args.originalMealPlanOfferId,
        parentMealPlanOfferId: args.parentMealPlanOfferId,
        data: stringifyObject(args.newMealPlanOffer.data),
        sortWeight: args.newMealPlanOffer.sortWeight,
        mealPlanOfferCreateTime: args.session.requestTimestamp,
        sessionId: args.session.sessionId
    }
    // create mealPlanOffer id
    setId(mealPlanOffer, 'mealPlanOfferId', 'originalMealPlanOfferId')
    // insert mealPlanOffer
    return db('immutable').query(
        'INSERT INTO `mealPlanOffer` VALUES(UNHEX(:mealPlanOfferId), UNHEX(:originalMealPlanOfferId), UNHEX(:parentMealPlanOfferId), UNHEX(:sessionId), :data, :sortWeight, :mealPlanOfferCreateTime)',
        mealPlanOffer,
        undefined,
        args.session
    ).then(function () {
        // return mealPlanOffer data on successful insert
        return jsonParseMulti(mealPlanOffer, 'data')
    })
}

/**
 * @function deleteMealPlanOffer
 *
 * @param {string} mealPlanOfferId - hex id of mealPlanOffer
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function deleteMealPlanOffer (args) {
    // build data
    var deleteData = {
        mealPlanOfferId: args.mealPlanOfferId,
        sessionId: args.session.sessionId,
        mealPlanOfferDeleteCreateTime: args.session.requestTimestamp,
    }
    // insert mealPlanOffer delete
    return db('immutable').query(
        'INSERT INTO `mealPlanOfferDelete` VALUES(UNHEX(:mealPlanOfferId), UNHEX(:sessionId), :mealPlanOfferDeleteCreateTime)',
        deleteData,
        undefined,
        args.session
    ).then(function () {
        return deleteData
    })
}


/**
 * @function publishMealPlanOffer
 *
 * @param {string} mealPlanOfferId - hex id of mealPlanOffer
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function publishMealPlanOffer (args) {
    // build data
    var publish = {
        mealPlanOfferId: args.mealPlanOfferId,
        sessionId: args.session.sessionId,
        mealPlanOfferPublishCreateTime: args.session.requestTimestamp,
    }
    // insert mealPlanOffer publish
    return db('immutable').query(
        'INSERT INTO `mealPlanOfferPublish` VALUES(UNHEX(:mealPlanOfferId), UNHEX(:sessionId), :mealPlanOfferPublishCreateTime)',
        publish,
        undefined,
        args.session
    ).then(function () {
        return publish
    })
}

/**
 * @function getMealPlanOffers
 *
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanOffers (args) {
    return db('immutable').query(
        'SELECT HEX(mpo.mealPlanOfferId) AS mealPlanOfferId, HEX(mpo.originalMealPlanOfferId) AS originalMealPlanOfferId, HEX(mpo.parentMealPlanOfferId) AS parentMealPlanOfferId, mpo.data, mpo.sortWeight, mpo.mealPlanOfferCreateTime, mpop.mealPlanOfferPublishCreateTime, mpod.mealPlanOfferDeleteCreateTime FROM mealPlanOffer mpo JOIN mealPlanOfferPublish mpop ON mpo.mealPlanOfferId = mpop.mealPlanOfferId LEFT JOIN mealPlanOfferDelete mpod ON mpo.mealPlanOfferId = mpod.mealPlanOfferId WHERE mpo.mealPlanOfferCreateTime <= :requestTimestamp AND mpop.mealPlanOfferPublishCreateTime <= :requestTimestamp AND ( mpod.mealPlanOfferDeleteCreateTime IS NULL OR mpod.mealPlanOfferDeleteCreateTime > :requestTimestamp ) ORDER BY mpo.sortWeight',
        {
            requestTimestamp: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return response with json parsed
        return jsonParseMulti(res, 'data')
    })
}

/**
 * @function getMealPlanOfferById
 *
 * @param {string} mealPlanOfferId - hex id of mealPlanOffer to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanOfferById (args) {
    return db('immutable').query(
        'SELECT HEX(mpo.mealPlanOfferId) AS mealPlanOfferId, HEX(mpo.originalMealPlanOfferId) AS originalMealPlanOfferId, HEX(mpo.parentMealPlanOfferId) AS parentMealPlanOfferId, mpo.data, mpo.sortWeight, mpo.mealPlanOfferCreateTime, mpop.mealPlanOfferPublishCreateTime, mpod.mealPlanOfferDeleteCreateTime FROM mealPlanOffer mpo LEFT JOIN mealPlanOfferPublish mpop ON mpo.mealPlanOfferId = mpop.mealPlanOfferId LEFT JOIN mealPlanOfferDelete mpod ON mpo.mealPlanOfferId = mpod.mealPlanOfferId WHERE mpo.mealPlanOfferId = UNHEX(:mealPlanOfferId) AND mpo.mealPlanOfferCreateTime <= :requestTimestamp ORDER BY mpo.sortWeight',
        {
            mealPlanOfferId: args.mealPlanOfferId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse mealPlanOffer data
        jsonParseMulti(res, 'data')
        // return mealPlanOffer or undefined
        return res.length ? res[0] : undefined
    })
}

/**
 * @function getMealPlanOffersById
 *
 * @param {string} mealPlanOfferId - hex id of mealPlanOffer to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanOffersById (args) {
    // build in query for mealPlanOffer ids - this validates inputs so output is safe
    var mealPlanOfferIdInQuery = idInQuery(args.mealPlanOfferIds)
    // no valid input
    if (!mealPlanOfferIdInQuery) {
        return
    }
    return db('immutable').unpreparedQuery(
        'SELECT HEX(mpo.mealPlanOfferId) AS mealPlanOfferId, HEX(mpo.originalMealPlanOfferId) AS originalMealPlanOfferId, HEX(mpo.parentMealPlanOfferId) AS parentMealPlanOfferId, mpo.data, mpo.sortWeight, mpo.mealPlanOfferCreateTime FROM mealPlanOffer mpo JOIN mealPlanOfferPublish mpop ON mpo.mealPlanOfferId = mpop.mealPlanOfferId LEFT JOIN mealPlanOfferDelete mpod ON mpo.mealPlanOfferId = mpod.mealPlanOfferId WHERE mpo.mealPlanOfferCreateTime <= :requestTimestamp AND mpop.mealPlanOfferPublishCreateTime <= :requestTimestamp AND ( mpod.mealPlanOfferDeleteCreateTime IS NULL OR mpod.mealPlanOfferDeleteCreateTime > :requestTimestamp ) AND mpo.mealPlanOfferId '+mealPlanOfferIdInQuery+' ORDER BY mpo.sortWeight',
        {
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return mealPlanOffers with json parsed
        return jsonParseMulti(res, 'data')
    })
}

/**
 * @function getMealPlanOfferByOriginalMealPlanOfferId
 *
 * @param {string} originalMealPlanOfferId - hex id of parent mealPlanOffer
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMostRecentMealPlanOfferByOriginalMealPlanOfferId (args) {
    // select mealPlanOffer by id
    return db('immutable').query(
        'SELECT HEX(c.mealPlanOfferId) AS mealPlanOfferId, HEX(c.originalMealPlanOfferId) AS originalMealPlanOfferId, HEX(c.parentMealPlanOfferId) AS parentMealPlanOfferId, HEX(c.sessionId) AS sessionId, c.data, c.sortWeight, c.mealPlanOfferCreateTime FROM mealPlanOffer c LEFT JOIN mealPlanOffer c2 ON c.mealPlanOfferId = c2.parentMealPlanOfferId WHERE c2.mealPlanOfferId IS NULL AND c.originalMealPlanOfferId = UNHEX(:originalMealPlanOfferId) ORDER BY c.mealPlanOfferCreateTime DESC LIMIT 1',
        {
            originalMealPlanOfferId: args.originalMealPlanOfferId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse mealPlanOffer data
        jsonParseMulti(res, 'data')
        // return mealPlanOffer or undefined
        return res.length ? res[0] : undefined
    })
}
