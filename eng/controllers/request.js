'use strict'

/* application libraries */
var requestModel = require('../models/request')

/* public functions */
var requestController = module.exports = {
    getRequest: getRequest,
    getRequests: getRequests,
}

/**
 * @function getRequest
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getRequest (req) {

}

/**
 * @function getRequest
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getRequests (req) {
    return requestModel.getRequests().then(function (res) {
        return {requests: res}
    })
}