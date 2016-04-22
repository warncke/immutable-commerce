'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var apiRouteHandler = require('../lib/api-route-handler')
var mealPlanOfferController = require('../controllers/meal-plan-offer')

/* routes */

// get list of meal plan offers
router.get('/meal-plan-offer', apiRouteHandler(mealPlanOfferController.getMealPlanOffers))
// get a specific meal plan offer
router.get('/meal-plan-offer/:mealPlanOfferId', apiRouteHandler(mealPlanOfferController.getMealPlanOfferById))
// create new meal plan offer
router.post('/meal-plan-offer', apiRouteHandler(mealPlanOfferController.createMealPlanOffer))
// udpate meal plan offer
router.put('/meal-plan-offer/:mealPlanOfferId', apiRouteHandler(mealPlanOfferController.updateMealPlanOffer))
// delete meal plan offer
router.delete('/meal-plan-offer/:mealPlanOfferId', apiRouteHandler(mealPlanOfferController.deleteMealPlanOffer))
// publish meal plan offer
// create new meal plan offer
router.post('/meal-plan-offer/:mealPlanOfferId/publish', apiRouteHandler(mealPlanOfferController.publishMealPlanOffer))

module.exports = router
