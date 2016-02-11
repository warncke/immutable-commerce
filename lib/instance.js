'use strict'

/* npm modules */
var express = require('express')
var moment = require('moment')
var os = require('os')

/* application modules */
var log = require('../lib/log')
var stableIdWithData = require('../lib/stable-id-with-data')

// generate instnace id once per process
var instanceId

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
    // build instance data
    var instanceData = {
        arch: process.arch,
        argv: process.argv,
        config: process.config,
        env: process.env,
        hostname: os.hostname(),
        instanceCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
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

module.exports = instance