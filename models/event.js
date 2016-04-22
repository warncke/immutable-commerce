'use strict'

/* application libraries */
var db = require('../lib/database')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
var eventModel = module.exports = immutable.model('Event', {
    createEvent: createEvent,
    getEventById: getEventById,
    getEvents: getEvents
})

/**
 * @function createEvent
 *
 * @param {string} frUid - current frUid
 * @param {string} eventName - name of the event to save
 * @param {object} shopperProfileData - shopper profile data
 * @param {object} eventData - event data
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createEvent (args) {
    // build event data
    var eventObj = {
        frUid: args.frUid,
        sessionId: args.session.sessionId,
        eventName: args.eventName,
        shopperProfileData: stringifyObject(args.shopperProfileData),
        eventData: stringifyObject(args.eventData),
        eventCreateTime: args.session.requestTimestamp,
    }
    // create event id
    setId(eventObj, 'eventId')
    // insert event
    return db('immutable').query(
        'INSERT INTO `event` VALUES(UNHEX(:eventId), :frUid, UNHEX(:sessionId), :eventName, :shopperProfileData, :eventData, :eventCreateTime)',
        eventObj,
        undefined,
        args.session
    ).then(function () {
        // return event data on successful insert
        return eventObj
    })
}

/**
 * @function getEventById
 *
 * @param {string} eventId - hex id of event to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getEventById (args) {
    return db('immutable').query(
        'SELECT HEX(t.eventId) AS eventId, t.frUid, t.eventName, t.shopperProfileData, t.eventData, t.eventCreateTime FROM event t WHERE t.eventId = UNHEX(:eventId) AND t.eventCreateTime <= :requestTimestamp',
        {
            eventId: args.eventId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse event data
        jsonParseMulti(res, ['eventData', 'shopperProfileData'])
        // return event or undefined
        return res.length ? res[0] : undefined
    })
}

/**
 * @function getEvents
 *
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getEvents (args) {
    return db('immutable').query(
        'SELECT HEX(t.eventId) AS eventId, t.frUid, t.eventName, t.shopperProfileData, t.eventData, t.eventCreateTime FROM event t WHERE t.eventCreateTime <= :requestTimestamp',
        {
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse event data
        jsonParseMulti(res, ['eventData', 'shopperProfileData'])
        // return event or undefined
        return res
    })
}
