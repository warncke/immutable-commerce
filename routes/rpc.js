'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* application libraries */
var accessDenied = require('../lib/access-denied')
var badRequest = require('../lib/bad-request')
var config = require('../config/immutable')
var immutable = require('../lib/immutable')
var session = require('../lib/session')

/* routes */

// get list of products
router.post('/rpc', rpc)

module.exports = router

/* route handlers */

/**
 * @function rpc
 *
 * @param {obj} req
 * @param {obj} res
 * @param (function) next
 */
function rpc (req, res, next) {
    // require valid RPC key
    if (req.body.rpcKey !== config.rpcKey) {
        // return access denied error
        return accessDenied().catch(function (err) {next(err)})
    }
    // get function to call
    try {
        var method = immutable.getMethod(req.body.method)
    }
    catch (err) {
        next(err)
    }
    // get args for method being called
    var args = req.body.params
    // all calls require params
    if (!(args)) {
        // return bad request error
        return badRequest("params required").catch(function (err) {next(err)})
    }
    // all calls require a session
    if (!(args.session)) {
        // return bad request error
        return badRequest("params.session required").catch(function (err) {next(err)})
    }
    // create session object
    args.session = new session.Session(args.session)
    // if replay flag is set then set this on session
    if (req.body.replay) {
        args.session.replay = true
    }
    // call function with request params
    method(args)
    // handle response
    .then(function (data) {
        res.send({result: data})
    })
    // handle error
    .catch(function (err) {
        next(err)
    })
}