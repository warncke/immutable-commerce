'use strict'

/* npm modules */
var express = require('express')
var os = require('os')

/* application modules */
var instanceId = require('./instance-id')
var log = require('./log')

// instance id singleton
var idData

/* public functions */
module.exports = instance

/**
 * @function instance
 *
 * @param {object} args
 *
 * @return {string} instanceId - hex instance id
 */
function instance (args) {
    // generate instance id if it does not exist
    if (!idData) {
        idData = instanceId()
    }
    // if args are passed then log instance data 
    if (args) {
        log.log('instance', {
            arch: process.arch,
            argv: process.argv,
            config: process.config,
            env: process.env,
            hostname: os.hostname(),
            instanceCreateTime: idData.timestamp,
            instanceId: idData.id,
            ipAddress: args.ipAddress,
            ipVersion: args.ipVersion,
            pid: process.pid,
            port: args.port,
            release: process.release,
            version: process.version,
            versions: process.versions,
        })
    }
    // return instance id
    return idData.id
}