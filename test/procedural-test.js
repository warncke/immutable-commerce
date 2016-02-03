'use strict'

/* application libraries */

var _ = require('lodash')
var commandLineArgs = require("command-line-args")
var crypto = require('crypto')
var deepEqual = require('deep-equal')
var fs = require('fs')
var request = require('request')
var moment = require('moment')
var rp = require('request-promise')
var seedrandom = require('seedrandom')

/* models */

var productModel = require('../models/product')

/* CLI setup */

var cli = commandLineArgs([
    { name: "avgDelay", type: Number, defaultValue: 1000 },
    { name: "avgMod", type: Number, defaultValue: 15 },
    { name: "baseUrl", type: String, defaultValue: "http://marketplace.dev:3000" },
    { name: "concurrent", alias: "c", type: Number, defaultValue: 500 },
    { name: "help", type: Boolean, defaultValue: false },
    { name: "number", alias: "n", type: Number, defaultValue: 5000 },
    { name: "numProducts", type: Number, defaultValue: 100 },
])

var options = cli.parse()

// show help and exit
if (options.help) {
    printHelp()
    process.exit()
}

// get time for model queries
var requestTimestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS')

// start random number generator at same place every time
var rng = seedrandom(1);

/* program counters */

// number of concurrent tests current executing
var inflight = 0
// number of tests run
var run = 0
// number of tests started
var started = 0;

/* statistics */
var timeSum = 0
var timeCount = 0

var lastCount = 0
var lastTime = 0

var errorCount = 0
var requestCount = 0
var successCount = 0

var runStartTime = new Date().getTime()

/* test data */

// global product source
var products = [];

// load product ids
generateProductIds().then(function () {
    // print statistics periodically
    setTimeout(printStatus, 1000)

    // start execution of tests - this function will set a timeout
    // that recalls it until all tests are complete
    startTests()
});

/* program functions */

function finish () {

}

function modifyCartProducts (cartId, cookieJar) {
    // number of product modifications to perform
    var numMod = getRandom(options.avgMod - 5, options.avgMod + 5)
    // promises for all requests to be performed
    var promises = []
    // products for this test iteration
    var testProducts = []
    // time to delay before performing request
    var delay = 0
    // schedule requests
    for (var i=0; i < numMod; i++) {
        // get delay for this request instance - each request is delayed
        // past the request before it
        delay += getRandom(options.avgDelay - 100, options.avgDelay + 100)
        // product id to modify
        var productId
        // quantity to add or remove
        var quantity
        // if some products have already been modified in this test iteration then
        // either modify an existing product again or modify a new product
        if (testProducts.length && getRandom(0, 1)) {
            productId = testProducts[ getRandom(0, testProducts.length - 1) ]
            // quantity can be either positive or negative on existing product
            quantity = getRandom(-2, 5)
        }
        // get new product
        else {
            productId = products[ getRandom(0, products.length - 1) ]
            // always positive on new product
            quantity = getRandom(1, 5)
        }

        // add promise to list of promises for all requests
        promises.push( modifyCartProduct(cartId, cookieJar, delay, productId, quantity) )
    }
    // resolve once all requests complete
    return Promise.all(promises)
}

function modifyCartProduct (cartId, cookieJar, delay, productId, quantity) {
    // create promise that will be resolved when request complete
    return new Promise(function (resolve, reject) {
        // perform request after delay
        setTimeout(function () {
            requestCount++;

            rp({
                body: {
                    quantity: quantity
                },
                jar: cookieJar,
                json: true,
                method: 'POST',
                resolveWithFullResponse: true,
                time: true,
                uri: options.baseUrl+'/cart/'+cartId+'/product/'+productId,
            }).then(function (res) {
                // track successful requests
                successCount++
                // track request time
                timeCount++
                timeSum += res.elapsedTime
                // resolve outer promise
                resolve(res)
            }).catch(function (err) {
                errorCount++
                // keep going on errors for now
                resolve(err)
            })
        }, delay)
    })    
}

function runTest () {
    // keep track of tests started
    started++
    // add current test to in flight count
    inflight++

    // store cookies between requests
    var cookieJar = request.jar()

    // capture variables to pass between steps
    var cartId;

    requestCount++

    // request base URL to get session
    rp({
        jar: cookieJar,
        json: true,
        resolveWithFullResponse: true,
        time: true,
        uri: options.baseUrl,
    })
    // request cart
    .then(function (res) {
        successCount++
        requestCount++
        // track request time
        timeCount++
        timeSum += res.elapsedTime
        // request cart (creates new cart)
        return rp({
            jar: cookieJar,
            json: true,
            resolveWithFullResponse: true,
            time: true,
            uri: options.baseUrl+'/cart',
        })
    })
    // add and remove product from cart
    .then(function (res) {
        successCount++
        // track request time
        timeCount++
        timeSum += res.elapsedTime
        // capture cartId for use in later steps
        cartId = res.body.cartId
        // perform a variable number of product modifications
        return modifyCartProducts(cartId, cookieJar)
    })
    .then(function (res) {
        // update program counters
        inflight--
        run++
    })
    .catch(function (err) {
        errorCount++
        inflight--
        run++
    })
}

function startTests() {
    // begin execution of concurrent tests
    while (started < options.number && inflight < options.concurrent) {
        runTest()
        // start only one test per tick
        break
    }
    // if all tests run then end
    if (run == options.number) {
        finish()
        return
    }
    // recall after time out
    setTimeout(startTests, getRandom(2,10))
}

function printHelp () {
    console.log("\nUsage: node test/procedural-test.js [options]\n")
    console.log("\t--avgDelay\t[5000]\t\taverage time between requests (ms)")
    console.log("\t--avgMod\t[15]\t\taverage product modifications (add+remove)")
    console.log("\t--baseUrl\t[http://marketplace.dev:3000]")
    console.log("\t--concurrent\t[10000]\t\tnumber of tests to run concurrently")
    console.log("\t--number\t[100000]\t\ttotal number of tests to run")
    console.log("\t--numProducts\t[100]\t\tnumber of products to choose from")
    console.log("\n")
}

function printStatus () {
    var curTime = new Date().getTime();
    var runTime = curTime - runStartTime;

    var message = successCount + ' requests; ' + parseInt(successCount / (runTime / 1000)) + ' total rps'

    // calculate rps for last iteration only
    if (lastCount && lastTime) {
        message += '; ' + parseInt(successCount - lastCount / ((curTime - lastTime) / 1000)) + ' current rps'
    }
    // calculate avg request time
    if (timeCount > 0) {
        message += '; ' + (timeSum / timeCount).toFixed(2) + 'ms avg req time'
    }

    message += '; ' + errorCount + ' errors'

    lastCount = successCount
    lastTime = curTime

    console.log(message)

    // if all tests run then end
    if (run == options.number) {
        finish()
        return
    }
    // print status again after timeout
    setTimeout(printStatus, 1000)
}

/* data generation functions */

function generateProductIds () {
    return productModel.getProducts(requestTimestamp).then(function (res) {
        // add product ids to global list for use in tests
        for (var i=0; i < res.length; i++) {
            products.push(res[i].productId)
        }
    })
}

function getRandom (min, max) {
    return Math.floor(rng()*(max-min+1)+min);
}