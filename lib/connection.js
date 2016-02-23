'use strict'

/* npm modules */
var MariaSQL = require('mariasql')

/* application modules */
var instance = require('./instance')
var log = require('./log')
var microTimestamp = require('./micro-timestamp')
var stableId = require('./stable-id')
var stableIdWithData = require('./stable-id-with-data')

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
    // store connection params
    this.connectionName = connectionName
    this.connectionNum = connectionNum
    this.connectionParams = connectionParams
    this.connectionCreateTime = microTimestamp()
    // capture connection to log in callback
    var connection = this
    // log the db connection after break so other modules can load
    logConnection(connection)
    // create new client instance
    this.client = new MariaSQL(connectionParams)
    // prepared statements
    this.prepared = {}
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
    // capture module call id passed from caller as it might change
    var moduleCallId =  session ? session.moduleCallId : undefined
    // create new promise to perform query
    return new Promise(function (resolve, reject) {
        // db log id
        var dbQueryStartId
        // log query
        if (log.ENABLED && log.LOG_DB && session) {
            dbQueryStartId = logQueryStart(connection, query, params, options, session, moduleCallId)
        }
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
            if (dbQueryStartId) {
                logQueryFinish(dbQueryStartId, res)
            }
            // resolve promise with data
            return resolve(res)
        })
    })
}

/* private functions */

/**
 * @function logQueryFinish
 *
 * @param {string} dbQueryStartId - hex id of query start record
 * @param {object} res - response object
 */
function logQueryFinish (dbQueryStartId, res) {
    try {
        // get res id
        var dbQueryResponseId = stableIdWithData(res)
        // log data
        log.data(dbQueryResponseId)
        // build query data
        var dbQueryFinishData = {
            dbQueryFinishCreateTime: microTimestamp(),
            dbQueryResponseId: dbQueryResponseId.dataId,
            dbQueryStartId: dbQueryStartId,
        }
        // log query start
        log.dbQueryFinish(dbQueryFinishData)
    }
    // catch error
    catch (err) {
        log.error(err)
    }
}

/**
 * @function logQueryStart
 *
 * @param {object} connection - connection object
 * @param {string} query - sql query
 * @param {object} params - query params
 * @param {object} options - query options passed to client
 * @param {object} session
 * @param {string} moduleCallId - hex id of caller
 */
function logQueryStart (connection, query, params, options, session, moduleCallId) {
    try {
        // get db query id
        var dbQueryId = stableIdWithData(query)
        // log data
        log.data(dbQueryId)
        // get params id
        var dbQueryParamsId = stableIdWithData(params)
        // log data
        log.data(dbQueryParamsId)
        // get options id
        var dbQueryOptionsId = stableIdWithData(options)
        // log data
        log.data(dbQueryOptionsId)
        // build query data
        var dbQueryStartData = {
            dbConnectionId: connection.dbConnectionId,
            dbQueryId: dbQueryId.dataId,
            dbQueryOptionsId: dbQueryOptionsId.dataId,
            dbQueryParamsId: dbQueryParamsId.dataId,
            dbQueryStartCreateTime: microTimestamp(),
            moduleCallId: moduleCallId,
            requestId: session.req.requestId,
        }
        // get id
        var dbQueryStartId = dbQueryStartData.dbQueryStartId = stableId(dbQueryStartData)
        // log query start
        log.dbQueryStart(dbQueryStartData)
        // return id for logging response
        return dbQueryStartId
    }
    // catch error
    catch (err) {
        log.error(err)
    }
}

/**
 * @function logConnection
 *
 * @param {object} connection
 */
function logConnection (connection) {
    // get instance id
    var instanceId = instance()
    // if instance or log are not instantiated then try again later
    if (!(instanceId && log.data)) {
        setTimeout(function () {
            logConnection(connection)
        }, 10)
        return
    }
    // check that logging is enabled once log module is loaded
    if (!(log.ENABLED && log.LOG_DB)) {
        return
    }
    try {
        // get config data and id
        var dbConnectionParamsId = stableIdWithData(connection.connectionParams)
        // log data
        log.data(dbConnectionParamsId)
        // build connection data
        var dbConnectionData = {
            instanceId: instanceId,
            dbConnectionName: connection.connectionName,
            dbConnectionNum: connection.connectionNum,
            dbConnectionParamsId: dbConnectionParamsId.dataId,
            dbConnectionCreateTime: connection.connectionCreateTime,
        }
        // get connection id
        connection.dbConnectionId = dbConnectionData.dbConnectionId = stableId(dbConnectionData)
        // log db connection
        log.dbConnection(dbConnectionData)
    }
    // catch error
    catch (err) {
        log.error(err)
    }
}