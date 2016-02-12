'use strict'

/* npm modules */
var MariaSQL = require('mariasql')

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
    // create new promise to perform query
    return new Promise(function (resolve, reject) {
        // do async query
        connection.client.query(prepared(params), options, function (err, res) {
            // reqject promise on error
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
            // resolve promise with data
            return resolve(res)
        })
    })
}