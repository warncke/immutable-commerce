'use strict'

/* npm modules */
var MariaSQL = require('mariasql')

/* application modules */
var instance = require('./instance')
var log = require('./log')
var microTimestamp = require('./micro-timestamp')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')
var uniqueId = require('./unique-id')

/* public functions */
module.exports = Connection

/**
 * @function Connection - create a new connection instance
 *
 * @param {string} connectionName - name that connection is accessed by
 * @param {integer} connectionNum - connection number for this process
 * @param {object} connectionParams - connection params to pass to db driver
 */
function Connection (connectionName, connectionNum, connectionParams) {
    var connection = this
    // get unique id
    var idData = uniqueId()
    // store connection params
    connection.connectionName = connectionName
    connection.connectionNum = connectionNum
    connection.connectionParams = connectionParams
    connection.connectionCreateTime = idData.timestamp
    connection.connectionId = idData.id
    connection.instanceId = instance()
    // log the db connection
    log.log('dbConnection', connection)
    // create new client instance
    connection.client = new MariaSQL(connectionParams)
    // prepared statements
    connection.prepared = {}
}

/**
 * @function query
 *
 * @param {string} query - query string
 * @param {object} params - query params
 * @param {object} options - options to pass client
 * @param {session} session - session object for logging
 */
Connection.prototype.query = function (query, params, options, session) {
    var connection = this
    // build prepared statement if it does not already exist
    if (!this.prepared[query]) {
        this.prepared[query] = this.client.prepare(query)
    }
    var prepared = this.prepared[query]
    // get unique if for query
    var idData = uniqueId()
    // capture variables for logging
    var moduleCallId = session && session.moduleCallId
    var requestId = session && session.requestId
    // create new promise to perform query
    return new Promise(function (resolve, reject) {
        // db log id
        var dbQueryId
        // if replay is requested then load data from previous request
        if (session && session.replay) {
            dbQueryId = getDbQueryId(connection, query, params, options, session, moduleCallId)
            // load data from log database
            return log.getDbResponse({
                dbQueryId: dbQueryId,
            })
            // pass resolve/reject to outer promise
            .then(resolve).catch(reject)
        }
        // log db query
        log.log('dbQuery', {
            connectionId: connection.connectionId,
            connectionName: connection.connectionName,
            dbQueryCreateTime: idData.timestamp,
            dbQueryId: idData.id,
            query: query,
            params: params,
            options: options,
            moduleCallId: moduleCallId,
            requestId: requestId,
        })

        // do async query
        connection.client.query(prepared(params), options, function (err, res) {
            // reject promise on error
            if (err) {
                return reject(err)
            }
            // resolve immediately if not array
            if (!Array.isArray(res)) {
                return resolve(res)
            }
            // iterate over each row and convert all nulls to undefined
            // because JSON encoding does not include parameters with undefined
            // values this allows consistent hashes based on JSON encodings when
            // adding columns to a table where they are NULL for old entries
            // as well as consistent hashes between objects returned from DB and
            // objects generated from the app that are missing some parameters
            for (var i=0; i < res.length; i++) {
                var row = res[i]
                // get property names
                var columnNames = Object.keys(row)
                // iterate over each property
                for (var j=0; j < columnNames.length; j++) {
                    var columnName = columnNames[j]
                    // convert null to undefined
                    if (row[columnName] === null) {
                        row[columnName] = undefined
                    }
                }
            }
            // log response
            log.log('dbResponse', {
                dbQueryId: idData.id,
                dbResponseCreateTime: microTimestamp(),
                data: res,
                info: res.info,
            })
            // resolve promise with data
            return resolve(res)
        })
    })
}

/**
 * @function unpreparedQuery
 *
 * @param {string} query - query string
 * @param {object} params - query params
 * @param {object} options - options to pass client
 * @param {session} session - session object for logging
 */
Connection.prototype.unpreparedQuery = function (query, params, options, session) {
    var connection = this
    // capture module call id passed from caller as it might change
    var moduleCallId =  session ? session.moduleCallId : undefined
    // create new promise to perform query
    return new Promise(function (resolve, reject) {
        /*
        // promises for logging data
        var moduleCallIdPromise = session.moduleCallIdPromise
            ? session.moduleCallIdPromise : Promise.resolve()
        var requestIdPromise = session.requestIdPromise
            ? session.requestIdPromise : Promise.resolve()
        // log query - waiting till initial connection log completes
        var logPromise = log.dbQuery({
            connectionIdPromise: connection.connectionIdPromise,
            connectionName: connection.connectionName,
            query: query,
            params: params,
            options: options,
            session: session,
            moduleCallIdPromise: moduleCallIdPromise,
            requestIdPromise: requestIdPromise,
        })
        */
        // do async query
        connection.client.query(query, params, options, function (err, res) {
            // reject promise on error
            if (err) {
                return reject(err)
            }
            // resolve immediately if not array
            if (!Array.isArray(res)) {
                return resolve(res)
            }
            // iterate over each row and convert all nulls to undefined
            // because JSON encoding does not include parameters with undefined
            // values this allows consistent hashes based on JSON encodings when
            // adding columns to a table where they are NULL for old entries
            // as well as consistent hashes between objects returned from DB and
            // objects generated from the app that are missing some parameters
            for (var i=0; i < res.length; i++) {
                var row = res[i]
                // get property names
                var columnNames = Object.keys(row)
                // iterate over each property
                for (var j=0; j < columnNames.length; j++) {
                    var columnName = columnNames[j]
                    // convert null to undefined
                    if (row[columnName] === null) {
                        row[columnName] = undefined
                    }
                }
            }
            /*
            // wait for db query log to complete then log response
            logPromise.then(function (logQueryRes) {
                return log.dbResponse({
                    dbQueryId: logQueryRes.dbQueryId,
                    data: res,
                    info: res.info,
                })
            })
            */
            // resolve promise with data
            return resolve(res)
        })
    })
}

/* private functions */

/**
 * @function getDbQueryId
 *
 * @param {object} connection - connection object
 * @param {string} query - sql query
 * @param {object} params - query params
 * @param {object} options - query options passed to client
 * @param {object} session
 * @param {string} moduleCallId - hex id of caller
 */
function getDbQueryId (connection, query, params, options, session, moduleCallId) {
    try {
        // get db query string id
        var dbQueryStringId = stableIdWithData(query)
        // get params id
        var dbQueryParamsId = stableIdWithData(params)
        // get options id
        var dbQueryOptionsId = stableIdWithData(options)
        // build query data
        var dbQueryData = {
            connectionName: connection.connectionName,
            dbQueryStringId: dbQueryStringId.dataId,
            dbQueryOptionsId: dbQueryOptionsId.dataId,
            dbQueryParamsId: dbQueryParamsId.dataId,
            moduleCallId: moduleCallId,
            requestId: session.requestId,
        }
        // get id
        var dbQueryId = stableId(dbQueryData)
        // return id for retrieving logged response
        return dbQueryId
    }
    // catch error
    catch (err) {
        log.error(err)
    }
}