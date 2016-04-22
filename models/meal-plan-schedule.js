'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')

/* public functions */
var mealPlanScheduleModel = immutable.model('MealPlanSchedule', {
    createMealPlanSchedule: createMealPlanSchedule,
    getMealPlanSchedulesForDate: getMealPlanSchedulesForDate
})
module.exports = mealPlanScheduleModel;

/**
 * @function createMealPlanSchedule
 *
 * @param {int} mealPlanTypeId - int id of mealPlanType
 * @param {date} mealPlanScheduleDeliveryDate - date of delivery
 * @param {object} productId - mealPlanSchedule productId for delivery date
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createMealPlanSchedule (args) {

    // build mealPlanSchedule data
    var mealPlanSchedule = {
        mealPlanTypeId: args.mealPlanTypeId,
        mealPlanScheduleDeliveryDate: args.mealPlanScheduleDeliveryDate,
        productId: args.productId,
        quantity: args.quantity,
        mealPlanScheduleCreateTime: args.session.requestTimestamp,
        sessionId: args.session.sessionId
    }
    // insert mealPlanSchedule
    return db('immutable').query(
        'INSERT INTO `mealPlanSchedule` (mealPlanTypeId, mealPlanScheduleDeliveryDate, productId, quantity, sessionId, mealPlanScheduleCreateTime) VALUES(:mealPlanTypeId, :mealPlanScheduleDeliveryDate, UNHEX(:productId), :quantity, UNHEX(:sessionId), :mealPlanScheduleCreateTime)',
        mealPlanSchedule,
        undefined,
        args.session
    ).then(function () {
        // return mealPlanSchedule data on successful insert
        return mealPlanSchedule
    })
}

/**
 * @function getMealPlanSchedulesForDate
 *
 * @param {date} mealPlanScheduleDeliveryDate - date for which to get schedules
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getMealPlanSchedulesForDate (args) {
    return db('immutable').query(
        'SELECT mps.mealPlanTypeId, mps.mealPlanScheduleDeliveryDate, HEX(mps.productId) as productId, mps.quantity, mps.mealPlanScheduleCreateTime, HEX(mpt.ordersConfigId) as ordersConfigId, mpt.data as mealPlanTypeData FROM mealPlanSchedule mps LEFT JOIN mealPlanType mpt ON mps.mealPlanTypeId = mpt.mealPlanTypeId WHERE mps.mealPlanScheduleDeliveryDate = :mealPlanScheduleDeliveryDate AND mps.mealPlanScheduleCreateTime <= :requestTimestamp ORDER BY mps.mealPlanScheduleCreateTime',
        {
            mealPlanScheduleDeliveryDate: args.mealPlanScheduleDeliveryDate,
            requestTimestamp: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        // return response with json parsed
        return jsonParseMulti(res, 'mealPlanTypeData')
    })
}
