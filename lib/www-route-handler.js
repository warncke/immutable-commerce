'use strict'

/* application libraries */
var argsFromReq = require('./args-from-req')
var render = require('./render')
var requireAccountRedirect = require('./require-account-redirect')

/* public functions */
module.exports = wwwRouteHandler

/**
 * @function wwwRouteHandler
 * 
 * @param {function} controllerFunction
 * @param {boolean} requireAccountRedirect
 * @param {string} template
 *
 * @returns {function}
 */
function wwwRouteHandler (args) {
    // create different route handlers depending on whether
    // or not account is required to access route
    return args.requireAccountRedirect
        ? wwwRouteHandlerClosed(args)
        : wwwRouteHandlerOpen(args)
}

/* private functions */

/**
 * @function wwwRouteHandlerClosed
 * 
 * @param {function} controllerFunction
 * @param {boolean} requireAccountRedirect
 * @param {string} template
 *
 * @returns {function}
 */
function wwwRouteHandlerClosed (args) {
    // copy variables used in closure
    var controllerFunction = args.controllerFunction
    var template = args.template
    // create express handler function that calls controller
    // and handles response
    return function (req, res, next) {
        // create arguments for controller from express request
        var args = argsFromReq(req)
        // redirect if not logged in
        return requireAccountRedirect(req)
        // browser is logged into account
        .then(function () {
            // call controller function
            return controllerFunction(args)
            // success
            .then(function (data) {
                // render
                render(req, res, template, data)
            })
        })
        // handle error
        .catch(function (err) {
            next(err)
        })
    }
}

/**
 * @function wwwRouteHandlerOpen
 * 
 * @param {function} controllerFunction
 * @param {boolean} requireAccountRedirect
 * @param {string} template
 *
 * @returns {function}
 */
function wwwRouteHandlerOpen (args) {
    // copy variables used in closure
    var controllerFunction = args.controllerFunction
    var template = args.template
    // create express handler function that calls controller
    // and handles response
    return function (req, res, next) {
        // create arguments for controller from express request
        var args = argsFromReq(req)
        // call controller function
        controllerFunction(args)
        // success
        .then(function (data) {
            // render
            render(req, res, template, data)
        })
        // handle error
        .catch(function (err) {
            next(err)
        })
    }
}