'use strict'

/* application libraries */
var dbQueryModel = require('../models/db-query')
var moduleCallModel = require('../models/module-call')
var notFound = require('../../lib/not-found')
var requestModel = require('../models/request')

/* public functions */
var requestController = module.exports = {
    getRequest: getRequest,
    getRequests: getRequests,
}

/**
 * @function getRequest
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getRequest (req) {
    var dbQueryPromise = dbQueryModel.getDbQueriesByRequestId({
        requestId: req.params.requestId,
    })
    var requestPromise = requestModel.getRequestById({
        requestId: req.params.requestId,
    })
    var moduleCallPromise = moduleCallModel.getModuleCallsByRequestId({
        requestId: req.params.requestId,
    })

    return Promise.all([dbQueryPromise, requestPromise, moduleCallPromise]).then(function (res) {
        var dbQueries = res[0]
        var request = res[1]
        var calls = res[2]
        // request id not found
        if (!request) {
            return notFound()
        }
        // list of db queries that do not belong to any call
        var nonCallDbQueries = []
        // merge db queries with calls
        for (var i=0; i < dbQueries.length; i++) {
            var dbQuery = dbQueries[i]
            // attempt to merge db query to call
            if (!mergeQueryToCall(calls, dbQuery)) {
                nonCallDbQueries.push(dbQuery)
            }
        }
        // return request data
        return {
            calls: calls,
            dbQueries: dbQueries,
            nonCallDbQueries: nonCallDbQueries,
            requestId: req.params.requestId,
            requests: [request],
        }
    })
}

/**
 * @function getRequest
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getRequests (req) {
    return requestModel.getRequests(req.query).then(function (res) {
        return {requests: res}
    })
}

/* private functions */

/**
 * @function mergeQueryToCalls
 *
 * @param {array} calls - list of call response objects
 * @param {object} query - db query record
 * 
 * @returns {bool}
 */
function mergeQueryToCall (calls, query) {
    // if module call id is not defined then cannot merge
    if (!query.moduleCallId) {
        return false
    }
    // look for call with matching id
    for (var i=0; i < calls.length; i++) {
        var call = calls[i]
        // query was initiated by this call
        if (query.moduleCallId === call.moduleCallId) {
            // make sure call has a queries array
            if (!call.queries) {
                call.queries = []
            }
            // add query to list
            call.queries.push(query)
            // flag call as having queries
            call.hasQuery = true
            // done
            return true
        }
    }
    // could not find match
    return false
}