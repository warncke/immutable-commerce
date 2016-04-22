'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stableId = require('../lib/stable-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('MealPlan', {
    activateMealPlan: activateMealPlan,
    cancelMealPlan: cancelMealPlan,
    createMealPlan: createMealPlan,
    getCurrentMealPlan: getCurrentMealPlan,
    getMealPlanById: getMealPlanById,
    getMealPlansByOrdersConfigId: getMealPlansByOrdersConfigId,
    getMostRecentMealPlanByOriginalMealPlanId: getMostRecentMealPlanByOriginalMealPlanId
})

/**
 * @function activateMealPlan
 *
 * @param {string} mealPlanId - hex id of mealPlanOffer
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function activateMealPlan (args) {
    // build data
    var activateData = {
        mealPlanId: args.mealPlanId,
        sessionId: args.session.sessionId,
        mealPlanActivateCreateTime: args.session.requestTimestamp,
    }
    // insert mealPlanOffer delete
    return db('immutable').query(
        'INSERT INTO `mealPlanActivate` VALUES(UNHEX(:mealPlanId), UNHEX(:sessionId), :mealPlanActivateCreateTime)',
        activateData,
        undefined,
        args.session
    ).then(function () {
        return activateData
    })
}

/**
 * @function cancelMealPlan
 *
 * @param {string} mealPlanId - hex id of mealPlanOffer
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function cancelMealPlan (args) {
    // build data
    var cancelData = {
        mealPlanId: args.mealPlanId,
        sessionId: args.session.sessionId,
        mealPlanCancelCreateTime: args.session.requestTimestamp,
    }
    // insert mealPlanOffer delete
    return db('immutable').query(
        'INSERT INTO `mealPlanCancel` VALUES(UNHEX(:mealPlanId), UNHEX(:sessionId), :mealPlanCancelCreateTime)',
        cancelData,
        undefined,
        args.session
    ).then(function () {
        return cancelData
    })
}

/**
 * @function createMealPlan
 *
 * @param {object} data - data to store with mealPlan
 * @param {string} originalMealPlanId - hex id of original mealPlan
 * @param {string} parentMealPlanId - hex id of parent mealPlan being modified
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createMealPlan (args) {
    // build mealPlan data
    var mealPlan = {
        data: stringifyObject(args.data),
        mealPlanCreateTime: args.session.requestTimestamp,
        originalMealPlanId: args.originalMealPlanId,
        parentMealPlanId: args.parentMealPlanId,
        accountId: args.accountId,
        sessionId: args.session.sessionId,
    }
    // set id
    setId(mealPlan, 'mealPlanId', 'originalMealPlanId')
    // Set orderConfigId based on mealOccasions configuration and dietaryPreferences if both are present
    if (!!args.data.config && !!args.data.config.mealOccasions && !!args.data.dietaryPreferences) {
        mealPlan.ordersConfigId = stableId({
            mealOccasionsConfig: args.data.config.mealOccasions,
            dietaryPreferences: args.data.dietaryPreferences
        });
    }
    // insert mealPlan
    return db('immutable').query(
        'INSERT INTO mealPlan VALUES(UNHEX(:mealPlanId), UNHEX(:originalMealPlanId), UNHEX(:parentMealPlanId), UNHEX(:accountId), UNHEX(:sessionId), :mealPlanCreateTime, UNHEX(:ordersConfigId), :data)',
        mealPlan,
        undefined,
        args.session
    ).then(function () {
        // deserialize data
        return jsonParseMulti(mealPlan, 'data')
    })
}

/**
 * @function getCurrentMealPlan
 *
 * @param {object} accountId - request accountId
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getCurrentMealPlan (args) {
    return getMealPlanByAccountId({
        accountId: args.accountId,
        session: args.session
    }).then(function (res) {
        // Check if a paln was found
        if (typeof res !== 'undefined') {
            // Plan found, return it
            return res;
        }
        // No plan found for account, fall back to session
        return getMealPlanBySessionId({
            session: args.session
        });
    });
}

/**
 * @function getMealPlanByAccountId
 *
 * @param {object} accountId - request accountId
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanByAccountId (args) {
    return db('immutable').query(
        // select the most recent mealPlan associated with the session
        'SELECT HEX(c.mealPlanId) AS mealPlanId, HEX(c.originalMealPlanId) AS originalMealPlanId, HEX(c.parentMealPlanId) AS parentMealPlanId, HEX(c.accountId) AS accountId, HEX(c.sessionId) AS sessionId, HEX(c.ordersConfigId) AS ordersConfigId, c.data, c.mealPlanCreateTime, mpa.mealPlanActivateCreateTime, mpc.mealPlanCancelCreateTime FROM mealPlan c LEFT JOIN mealPlan c2 ON c.mealPlanId = c2.parentMealPlanId LEFT JOIN mealPlanActivate mpa ON c.mealPlanId = mpa.mealPlanId LEFT JOIN mealPlanCancel mpc ON c.mealPlanId = mpc.mealPlanId WHERE c2.mealPlanId IS NULL AND c.accountId = UNHEX(:accountId) ORDER BY c.mealPlanCreateTime DESC LIMIT 1',
        {
            requestTimestamp: args.session.requestTimestamp,
            accountId: args.accountId
        },
        undefined,
        args.session
    ).then(function (res) {
        // return mealPlan if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })
}

/**
 * @function getMealPlanById
 *
 * @param {string} mealPlanId - hex id of parent mealPlan
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanById (args) {
    // select mealPlan by id
    return db('immutable').query(
        'SELECT HEX(mp.mealPlanId) AS mealPlanId, HEX(mp.originalMealPlanId) AS originalMealPlanId, HEX(mp.parentMealPlanId) AS parentMealPlanId, HEX(mp.accountId) AS accountId, HEX(mp.sessionId) AS sessionId, HEX(mp.ordersConfigId) AS ordersConfigId, mp.data, mp.mealPlanCreateTime, mpa.mealPlanActivateCreateTime, mpc.mealPlanCancelCreateTime FROM mealPlan mp LEFT JOIN mealPlanActivate mpa ON mp.mealPlanId = mpa.mealPlanId LEFT JOIN mealPlanCancel mpc ON mp.mealPlanId = mpc.mealPlanId WHERE mp.mealPlanId = UNHEX(:mealPlanId) AND mp.mealPlanCreateTime <= :requestTimestamp',
        {
            mealPlanId: args.mealPlanId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return mealPlan if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })
}

/**
 * @function getMealPlanBySessionId
 *
 * @param {object} session - session for which to find the meal plan
 *
 * @returns {Promise}
 */
function getMealPlanBySessionId (args) {
    return db('immutable').query(
        // select the most recent mealPlan associated with the session
        'SELECT HEX(c.mealPlanId) AS mealPlanId, HEX(c.originalMealPlanId) AS originalMealPlanId, HEX(c.parentMealPlanId) AS parentMealPlanId, HEX(c.accountId) AS accountId, HEX(c.sessionId) AS sessionId, HEX(c.ordersConfigId) AS ordersConfigId, c.data, c.mealPlanCreateTime, mpa.mealPlanActivateCreateTime, mpc.mealPlanCancelCreateTime FROM mealPlan c LEFT JOIN mealPlan c2 ON c.mealPlanId = c2.parentMealPlanId LEFT JOIN mealPlanActivate mpa ON c.mealPlanId = mpa.mealPlanId LEFT JOIN mealPlanCancel mpc ON c.mealPlanId = mpc.mealPlanId WHERE c2.mealPlanId IS NULL AND c.sessionId = UNHEX(:sessionId) ORDER BY c.mealPlanCreateTime DESC LIMIT 1',
        {
            requestTimestamp: args.session.requestTimestamp,
            sessionId: args.session.sessionId
        },
        undefined,
        args.session
    ).then(function (res) {
        // return mealPlan if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })
}

/**
 * @function getMealPlansByOrdersConfigId
 *
 * @param {object} ordersConfigId - ordersConfigId for which to get plans
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlansByOrdersConfigId(args) {
    return db('immutable').query(
        // select the most recent mealPlan associated with the session
        'SELECT HEX(c.mealPlanId) AS mealPlanId, HEX(c.originalMealPlanId) AS originalMealPlanId, HEX(c.parentMealPlanId) AS parentMealPlanId, HEX(c.accountId) AS accountId, HEX(c.sessionId) AS sessionId, HEX(c.ordersConfigId) AS ordersConfigId, c.data, c.mealPlanCreateTime, mpa.mealPlanActivateCreateTime, mpc.mealPlanCancelCreateTime FROM mealPlan c LEFT JOIN mealPlan c2 ON c.mealPlanId = c2.parentMealPlanId LEFT JOIN mealPlanActivate mpa ON c.mealPlanId = mpa.mealPlanId LEFT JOIN mealPlanCancel mpc ON c.mealPlanId = mpc.mealPlanId WHERE c2.mealPlanId IS NULL AND c.ordersConfigId = UNHEX(:ordersConfigId) ORDER BY c.mealPlanCreateTime DESC',
        {
            ordersConfigId: args.ordersConfigId,
            requestTimestamp: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse product data
        jsonParseMulti(res, 'data')
        // return modified response
        return res
    })
}

/**
 * @function getMealPlanByOriginalMealPlanId
 *
 * @param {string} originalMealPlanId - hex id of parent mealPlan
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMostRecentMealPlanByOriginalMealPlanId (args) {
    // select mealPlan by id
    return db('immutable').query(
        'SELECT HEX(c.mealPlanId) AS mealPlanId, HEX(c.originalMealPlanId) AS originalMealPlanId, HEX(c.parentMealPlanId) AS parentMealPlanId, HEX(c.sessionId) AS sessionId, HEX(c.ordersConfigId) AS ordersConfigId, c.data, c.mealPlanCreateTime, mpa.mealPlanActivateCreateTime, mpc.mealPlanCancelCreateTime FROM mealPlan c LEFT JOIN mealPlan c2 ON c.mealPlanId = c2.parentMealPlanId LEFT JOIN mealPlanActivate mpa ON c.mealPlanId = mpa.mealPlanId LEFT JOIN mealPlanCancel mpc ON c.mealPlanId = mpc.mealPlanId WHERE c2.mealPlanId IS NULL AND c.originalMealPlanId = UNHEX(:originalMealPlanId) ORDER BY c.mealPlanCreateTime DESC LIMIT 1',
        {
            originalMealPlanId: args.originalMealPlanId,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return mealPlan if found
        return res.length ? jsonParseMulti(res[0], 'data') : undefined
    })

}
