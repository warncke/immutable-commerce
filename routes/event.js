'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var eventController = require('../controllers/event')

/* routes */

// get events
router.get('/event', apiRouteHandler(eventController.getEvents))
// create event
router.post('/event', apiRouteHandler(eventController.createEvent))
// get specific event by id
router.get('/event/:eventId', apiRouteHandler(eventController.getEventById))

module.exports = router
