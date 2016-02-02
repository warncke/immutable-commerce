'use strict'

/* npm libraries */

/* helper functions */

var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var isDuplicate = require('../lib/is-duplicate')
var notFound = require('../lib/not-found')

/* models */

var orderModel = require('../models/order')

/* Order Controller Object */

function Order(req, res, next) {
    this.req = req
    this.res = res
    this.next = next
}

Order.prototype.getOrder = function getOrder () {

}

Order.prototype.getOrders = function getOrders () {
    
}

module.exports = Order