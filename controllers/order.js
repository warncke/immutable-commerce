'use strict'

/* npm libraries */

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var immutable = require('../lib/immutable')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')
var orderModel = require('../models/order')

/* public functions */
var orderController = module.exports = immutable.controller('Order', {
    getOrder: getOrder,
    getOrders: getOrders,
})

/**
 * @function getOrder
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getOrder (session) {

}

/**
 * @function getOrders
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getOrders (session) {
    
}