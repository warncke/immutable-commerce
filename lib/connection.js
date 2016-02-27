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
    logDbConnection(connection)
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
        // log query
        if (log.ENABLED && log.LOG_DB && session) {
            dbQueryId = logDbQuery(connection, query, params, options, session, moduleCallId)
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
            if (dbQueryId) {
                logDbResponse(dbQueryId, res)
            }
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
        // db log id
        var dbQueryId
        // log query
        if (log.ENABLED && log.LOG_DB && session) {
            dbQueryId = logDbQuery(connection, query, params, options, session, moduleCallId)
        }
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
            // log response
            if (dbQueryId) {
                logDbResponse(dbQueryId, res)
            }
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

/**
 * @function logDbQuery
 *
 * @param {object} connection - connection object
 * @param {string} query - sql query
 * @param {object} params - query params
 * @param {object} options - query options passed to client
 * @param {object} session
 * @param {string} moduleCallId - hex id of caller
 */
function logDbQuery (connection, query, params, options, session, moduleCallId) {
    try {
        // get db query string id
        var dbQueryStringId = stableIdWithData(query)
        // log data
        log.data(dbQueryStringId)
        // get params id
        var dbQueryParamsId = stableIdWithData(params)
        // log data
        log.data(dbQueryParamsId)
        // get options id
        var dbQueryOptionsId = stableIdWithData(options)
        // log data
        log.data(dbQueryOptionsId)
        // build query data
        var dbQueryData = {
            // include connection name in data used to generated unique id instead of
            // the connection id, which is instance specific
            connectionName: connection.connectionName,
            dbQueryStringId: dbQueryStringId.dataId,
            dbQueryOptionsId: dbQueryOptionsId.dataId,
            dbQueryParamsId: dbQueryParamsId.dataId,
            moduleCallId: moduleCallId,
            requestId: session.requestId,
        }
        // get id
        var dbQueryId = dbQueryData.dbQueryId = stableId(dbQueryData)
        // do not include query time in query id - this allows module calls to
        // be replayed. the moduleCallId confers uniqueness on the query id unless the
        // same exact query is being made multiple time in the same module call
        // this design needs further consideration to validate that it is robust
        dbQueryData.dbConnectionId = connection.dbConnectionId
        dbQueryData.dbQueryCreateTime = microTimestamp()
        // log query start
        log.dbQuery(dbQueryData)
        // return id for logging response
        return dbQueryId
    }
    // catch error
    catch (err) {
        log.error(err)
    }
}


/**
 * @function logDbResponse
 *
 * @param {string} dbQueryId - hex id of query start record
 * @param {object} res - response object
 */
function logDbResponse (dbQueryId, res) {
    try {
        // get res id - copy data to new object because the database driver
        // return a response that is an array with named properties set on it
        // which cannot be serialized
        var dbResponseId = stableIdWithData({
            data: res,
            info: res.info,
        })
        // log data
        log.data(dbResponseId)
        // build query data
        var dbResponseData = {
            dbResponseCreateTime: microTimestamp(),
            dbResponseId: dbResponseId.dataId,
            dbQueryId: dbQueryId,
        }
        // log query start
        log.dbResponse(dbResponseData)
    }
    // catch error
    catch (err) {
        log.error(err)
    }
}

/**
 * @function logDbConnection
 *
 * @param {object} connection
 */
function logDbConnection (connection) {
    // get instance id
    var instanceId = instance()
    // if instance or log are not instantiated then try again later
    if (!(instanceId && log.data)) {
        setTimeout(function () {
            logDbConnection(connection)
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