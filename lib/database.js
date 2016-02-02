'use strict';

var Connection = require('./connection')

// number of connections to open to db
var numConnections = 1

// global connection store
var connections = {
    immutable: [],
    drupal: [],
}

/* initialize database connections */

for (var i=0; i < numConnections; i++) {
    connections.immutable.push(
        new Connection({
            db: 'immutable',
            host: 'localhost',
            password: 'immutable',
            user: 'immutable',
        })
    )

    connections.drupal.push(
        new Connection({
            db: 'marketplace',
            host: 'localhost',
            password: '',
            user: 'root',
        })
    )
}

var i = 0;

function getConnection (connectionName) {
    if (typeof connections[connectionName] === 'undefined') {
        throw new Error('Invalid connectionName '+connectionName)
    }

    if (++i >= numConnections) {
        i = 0
    }

    return connections[connectionName][i]
}

module.exports = getConnection