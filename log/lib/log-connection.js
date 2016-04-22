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

    connection.client.query(prepared(params), options, function (err, res) {
        // log error
        if (err) {
            console.log(err)
        }
    })
}