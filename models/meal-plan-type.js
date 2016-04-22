'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var stableId = require('../lib/stable-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
var mealPlanTypeModel = immutable.model('MealPlanType', {
    createMealPlanType: createMealPlanType,
    getMealPlanTypes: getMealPlanTypes,
    getMealPlanTypeById: getMealPlanTypeById,
    getMealPlanTypeByOrdersConfigId: getMealPlanTypeByOrdersConfigId
})
module.exports = mealPlanTypeModel;

/**
 * @function createMealPlanType
 *
 * @param {int} mealPlanTypeId - int id of mealPlanType
 * @param {object} data - mealPlanType data
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createMealPlanType (args) {

    // build mealPlanType data
    var mealPlanType = {
        mealPlanTypeId: args.mealPlanTypeId,
        data: stringifyObject(args.data),
        mealPlanTypeCreateTime: args.session.requestTimestamp,
        sessionId: args.session.sessionId
    }
    // create ordersConfigId id
    mealPlanType.ordersConfigId = stableId({
        mealOccasionsConfig: args.data.mealOccasionsConfig,
        dietaryPreferences: args.data.dietaryPreferences
    });
    // insert mealPlanType
    return db('immutable').query(
        'INSERT INTO `mealPlanType` VALUES(:mealPlanTypeId, UNHEX(:ordersConfigId), :data, UNHEX(:sessionId), :mealPlanTypeCreateTime)',
        mealPlanType,
        undefined,
        args.session
    ).then(function () {
        // return mealPlanType data on successful insert
        return jsonParseMulti(mealPlanType, 'data')
    })
}

/**
 * @function getMealPlanTypes
 *
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanTypes (args) {
    return db('immutable').query(
        'SELECT mpo.mealPlanTypeId, HEX(mpo.ordersConfigId) AS ordersConfigId, mpo.data, mpo.mealPlanTypeCreateTime FROM mealPlanType mpo WHERE mpo.mealPlanTypeCreateTime <= :requestTimestamp ORDER BY mpo.mealPlanTypeId',
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
 * @function getMealPlanTypeById
 *
 * @param {int} mealPlanTypeId - int id of mealPlanType to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanTypeById (args) {
    return db('immutable').query(
        'SELECT mpo.mealPlanTypeId, HEX(mpo.ordersConfigId) AS ordersConfigId, mpo.data, mpo.mealPlanTypeCreateTime FROM mealPlanType mpo WHERE mpo.mealPlanTypeCreateTime <= :requestTimestamp AND mpo.mealPlanTypeId = :mealPlanTypeId',
        {
            mealPlanTypeId: args.mealPlanTypeId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse mealPlanType data
        jsonParseMulti(res, 'data')
        // return mealPlanType or undefined
        return res.length ? res[0] : undefined
    })
}

/**
 * @function getMealPlanTypeByOrdersConfigId
 *
 * @param {string} ordersConfigId - hex id of orders config to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanTypeByOrdersConfigId (args) {
    return db('immutable').query(
        'SELECT mpo.mealPlanTypeId, HEX(mpo.ordersConfigId) AS ordersConfigId, mpo.data, mpo.mealPlanTypeCreateTime FROM mealPlanType mpo WHERE mpo.mealPlanTypeCreateTime <= :requestTimestamp AND mpo.ordersConfigId = UNHEX(:ordersConfigId)',
        {
            ordersConfigId: args.ordersConfigId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse mealPlanType data
        jsonParseMulti(res, 'data')
        // return mealPlanType or undefined
        return res.length ? res[0] : undefined
    })
}
