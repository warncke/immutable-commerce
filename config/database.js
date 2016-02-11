'use strict'

module.exports = {
    connections: {
        drupal: {
            db: 'marketplace',
            host: 'localhost',
            numConnections: 10,
            password: '',
            user: 'root',
        },
        immutable: {
            db: 'immutable',
            host: 'localhost',
            numConnections: 10,
            password: 'immutable',
            user: 'immutable',
        },
        log: {
            db: 'log',
            host: 'localhost',
            numConnections: 10,
            password: 'immutable',
            user: 'immutable',
        },
    },
}