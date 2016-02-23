'use strict'

/* application libraries */
var errorModel = require('../models/error')

/* public functions */
var errorController = module.exports = {
    getErrors: getErrors,
}

/**
 * @function getErrors
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getErrors (req) {
    return errorModel.getErrors(req.query).then(function (res) {
        return {errors: res}
    })
}