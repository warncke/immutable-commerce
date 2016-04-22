'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var mealPlanController = require('../controllers/meal-plan')

/* routes */

// get most recent active mealPlan for session or create new mealPlan
router.get('/meal-plan', apiRouteHandler(mealPlanController.getCurrentMealPlan))
// always create new mealPlan
router.post('/meal-plan', apiRouteHandler(mealPlanController.createMealPlan))
// get specific mealPlan by id
router.get('/meal-plan/:mealPlanId', apiRouteHandler(mealPlanController.getMealPlanById))
// activate mealPlan
router.put('/meal-plan/:mealPlanId/activate', apiRouteHandler(mealPlanController.activateMealPlan))
// cancel mealPlan
router.put('/meal-plan/:mealPlanId/cancel', apiRouteHandler(mealPlanController.cancelMealPlan))
// update mealPlan
router.put('/meal-plan/:mealPlanId', apiRouteHandler(mealPlanController.updateMealPlan))

module.exports = router
