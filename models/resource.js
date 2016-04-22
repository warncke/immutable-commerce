'use strict'

/* application libraries */
var immutable = require('../lib/immutable')
var db = require('../lib/database')
var setId = require('../lib/set-id')

/* public functions */
module.exports = immutable.controller('ResourceModel', {
    createResource: createResource,
})

/**
 * @function createResource
 *
 * @param {string} ownerId
 * @param {string} resourceName
 *
 * @returns {Promise}
 */
function createResource (args) {
    // build data
    var resourceData = {
        ownerId: args.ownerId,
        resourceName: args.resourceName,
        resourceCreateTime: args.session.requestTimestamp,
        sessionId: args.session.sessionId,
    }
    // set ids
    setId(resourceData, 'resourceId')
    // insert record
    return db('resource').query(`
        INSERT INTO \`resource\` VALUES(
            UNHEX(:resourceId),
            UNHEX(:ownerId),
            :resourceCreateTime,
            :resourceName,
            UNHEX(:sessionId)
        )`,
        resourceData,
        undefined,
        args.session
    )
    // success
    .then(function () {
        // return data
        return resourceData
    })
}

/**
 * @function deleteResource
 *
 * @param {string} resourceId
 * @param {string} resourceDeleteCreateTime
 *
 * @returns {Promise}
 */
function deleteResource (args) {
    // build data
    var resourceDeleteData = {
        resourceId: args.resourceId,
        resourceDeleteCreateTime: args.resourceDeleteCreateTime || args.session.requestTimestamp,
        sessionId: args.session.sessionId,
    }
    // set id
    setId(deleteResourceData, 'resourceDeleteId')
    // insert record
    return db('resource').query(`
        INSERT INTO \`resourceDelete\` VALUES(
            UNHEX(:resourceDeleteId),
            UNHEX(:resourceId),
            UNHEX(:sessionId),
            :resourceDeleteCreateTime
        )`,
        resourceDeleteData,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        return true
    })
}

/**
 * @function publishResource
 *
 * @param {string} resourceId
 * @param {string} resourcePublishCreateTime
 *
 * @returns {Promise}
 */
function publishResource (args) {
    // build data
    var resourcePublishData = {
        resourceId: args.resourceId,
        resourcePublishCreateTime: args.resourcePublishCreateTime || args.session.requestTimestamp,
        sessionId: args.session.sessionId,
    }
    // set id
    setId(publishResourceData, 'resourcePublishId')
    // insert record
    return db('resource').query(`
        INSERT INTO \`resourcePublish\` VALUES(
            UNHEX(:resourcePublishId),
            UNHEX(:resourceId),
            UNHEX(:sessionId),
            :resourcePublishCreateTime
        )`,
        resourcePublishData,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        return true
    })
}

/**
 * @function undeleteResource
 *
 * @param {string} resourceId
 * @param {string} resourceUndeleteCreateTime
 *
 * @returns {Promise}
 */
function undeleteResource (args) {
    // build data
    var resourceUndeleteData = {
        resourceId: args.resourceId,
        resourceUndeleteCreateTime: args.resourceUndeleteCreateTime || args.session.requestTimestamp,
        sessionId: args.session.sessionId,
    }
    // set id
    setId(undeleteResourceData, 'resourceUndeleteId')
    // insert record
    return db('resource').query(`
        INSERT INTO \`resourceUndelete\` VALUES(
            UNHEX(:resourceUndeleteId),
            UNHEX(:resourceId),
            UNHEX(:sessionId),
            :resourceUndeleteCreateTime
        )`,
        resourceUndeleteData,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        return true
    })
}

/**
 * @function unpublishResource
 *
 * @param {string} resourceId
 * @param {string} resourceUnpublishCreateTime
 *
 * @returns {Promise}
 */
function unpublishResource (args) {
    // build data
    var resourceUnpublishData = {
        resourceId: args.resourceId,
        resourceUnpublishCreateTime: args.resourceUnpublishCreateTime || args.session.requestTimestamp,
        sessionId: args.session.sessionId,
    }
    // set id
    setId(unpublishResourceData, 'resourceUnpublishId')
    // insert record
    return db('resource').query(`
        INSERT INTO \`resourceUnpublish\` VALUES(
            UNHEX(:resourceUnpublishId),
            UNHEX(:resourceId),
            UNHEX(:sessionId),
            :resourceUnpublishCreateTime
        )`,
        resourceUnpublishData,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        return true
    })
}
