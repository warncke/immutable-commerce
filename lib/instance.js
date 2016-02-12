'use strict'

/* npm modules */
var express = require('express')
var os = require('os')

/* application modules */
var log = require('../lib/log')
var microTimestamp = require('./micro-timestamp')
var stableIdWithData = require('../lib/stable-id-with-data')

// instance id singleton
var instanceId

/* public functions */
module.exports = instance

/**
 * @function instance
 *
 * @param {string} ipAddress
 * @param {string} ipVersion
 * @param {string} port
 *
 * @return {string} instanceId - hex instance id
 */
function instance (args) {
    // return instance id if already generated for this process
    if (instanceId) {
        return instanceId
    }
    // there were no args passed and instance is not instantiated
    if (!args) {
        return
    }
    // build instance data
    var instanceData = {
        arch: process.arch,
        argv: process.argv,
        config: process.config,
        env: process.env,
        hostname: os.hostname(),
        instanceCreateTime: microTimestamp(),
        ipAddress: args.ipAddress,
        ipVersion: args.ipVersion,
        pid: process.pid,
        port: args.port,
        release: process.release,
        version: process.version,
        versions: process.versions,
    }
    // get unique instance id
    var stableId = stableIdWithData(instanceData)
    // set instnace id for instnace data
    instanceId = instanceData.instanceId = stableId.dataId
    // log instance data
    log.data(stableId)
    // log instance instantiation
    log.instance(instanceData)
    // return instance id which is used for logging
    return instanceId
}