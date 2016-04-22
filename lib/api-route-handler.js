'use strict'

/* application libraries */
var argsFromReq = require('./args-from-req')

/* public functions */
module.exports = apiRouteHandler

/**
 * @function routeHandler
 * 
 * @param {function} controllerFunction
 *
 * @returns {function}
 */
function apiRouteHandler (controllerFunction) {
    // create express handler function that call controller
    // and handles response
    return function (req, res, next) {
        // create arguments for controller from express request
        var args = argsFromReq(req)
        // call controller function
        controllerFunction(args)
        // success
        .then(function (data) {
            res.send(data)
        })
        // handle error
        .catch(function (err) {
            next(err)
        })
    }
}