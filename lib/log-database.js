'use strict';

/* application modules */
var config = require('../config/database')
var Connection = require('./log-connection')

// global connection store
var connections = {}

// default number of connections to create per database
var defaultNumConnections = config.numConnections || 1

/* initialize database connections */

// get connection names from config file
var connectionNames = Object.keys(config.connections)

for (var i=0; i < connectionNames.length; i++) {
    var connectionName = connectionNames[i]
    // skip log database which is created separately
    if (connectionName !== 'log' && connectionName !== 'logEng') {
        continue
    }
    var connectionConfig = config.connections[connectionName]
    // create connections
    var connectionData = connections[connectionName] = {
        connections: [],
        numConnections: 0,
        lastConnection: 0,
    }
    // get number of connections
    connectionData.numConnections = connectionConfig.numConnections || defaultNumConnections
    // create connections
    for (var j=0; j < connectionData.numConnections; j++) {
        var connectionNum = j
        connectionData.connections.push(
            new Connection(
                connectionName,
                connectionNum,
                connectionConfig
            )
        )
    }
}

function getConnection (connectionName) {
    var connectionData = connections[connectionName]
    // require connection
    if (!connectionData) {
        throw new Error('Invalid connectionName '+connectionName)
    }

    if (++connectionData.lastConnection >= connectionData.numConnections) {
        connectionData.lastConnection = 0
    }

    return connectionData.connections[connectionData.lastConnection]
}

module.exports = getConnection