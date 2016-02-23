'use strict'

/* npm libraries */

var _ = require('lodash')
var commandLineArgs = require("command-line-args")
var crypto = require('crypto')
var deepEqual = require('deep-equal')
var fs = require('fs')
var request = require('request')
var moment = require('moment')
var rp = require('request-promise')
var seedrandom = require('seedrandom')
var stringify = require('json-stable-stringify')

/* application libraries */

var productModel = require('../models/product')

/* CLI setup */

var cli = commandLineArgs([
    { name: "avgDelay", type: Number, defaultValue: 10000 },
    { name: "avgMod", type: Number, defaultValue: 15 },
    { name: "baseUrl", type: String, defaultValue: "http://marketplace.dev:9077" },
    { name: "concurrent", alias: "c", type: Number, defaultValue: 500 },
    { name: "help", type: Boolean, defaultValue: false },
    { name: "number", alias: "n", type: Number, defaultValue: 1000 },
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

var testErrors = 0

var runStartTime = new Date().getTime()

/* test data */

// global product source
var products = [];

// pre-generated test plan that includes all steps to be taken
var testPlans = []

// load product ids
generateProductIds().then(function () {
    // require products to continue
    if (!products.length) {
        console.log('no products loaded')
        process.exit()
    }
    // create test plans now that products are loaded
    testPlans = createTestPlans()
    // print statistics periodically
    setTimeout(printStatus, 1000)
    // start execution of tests - this function will set a timeout
    // that recalls it until all tests are complete
    startTests()
});

/* http request functions */

function get (cookieJar, url) {
    // create promise that will be resolved when request complete
    return new Promise(function (resolve) {
        requestCount++;
        // get start time
        var startTime = new Date().getTime()
        // make request
        rp({
            jar: cookieJar,
            json: true,
            uri: options.baseUrl+url,
        })
        .then(function (res) {
            // track success
            successCount++
            // get run time
            var runTime = new Date().getTime() - startTime
            // track request time
            timeCount++
            timeSum += runTime
            // resolve
            resolve(res)
        })
        .catch(function (err) {
            console.log(err)
            // track error
            errorCount++
            // also resolve on error so execution does not halt
            resolve(err)
        })
    })
}

function post (cookieJar, url, body) {
    // create promise that will be resolved when request complete
    return new Promise(function (resolve) {
        requestCount++;
        // get start time
        var startTime = new Date().getTime()
        // make request
        rp({
            body: body,
            jar: cookieJar,
            json: true,
            method: 'POST',
            uri: options.baseUrl+url,
        })
        .then(function (res) {
            // track success
            successCount++
            // get run time
            var runTime = new Date().getTime() - startTime
            // track request time
            timeCount++
            timeSum += runTime
            // resolve
            resolve(res)
        })
        .catch(function (err) {
            console.log(err)
            // track error
            errorCount++
            // also resolve on error so execution does not halt
            resolve(err)
        })
    })
}

function put (cookieJar, url, body) {
    // create promise that will be resolved when request complete
    return new Promise(function (resolve) {
        requestCount++;
        // get start time
        var startTime = new Date().getTime()
        // make request
        rp({
            body: body,
            jar: cookieJar,
            json: true,
            method: 'PUT',
            uri: options.baseUrl+url,
        })
        .then(function (res) {
            // track success
            successCount++
            // get run time
            var runTime = new Date().getTime() - startTime
            // track request time
            timeCount++
            timeSum += runTime
            // resolve
            resolve(res)
        })
        .catch(function (err) {
            console.log(err)
            // track error
            errorCount++
            // also resolve on error so execution does not halt
            resolve(err)
        })
    })
}

/* test functions */

function modifyCartProducts (cartId, cookieJar, testPlan, modNum, cartProducts) {
    // get modification spec
    var mod = testPlan.mods[modNum];
    // return error on bad mod
    if (!mod) {
        return Promise.reject()
    }
    // create cart modification that will execute after delay
    return modifyCartProduct(
        cartId,
        cookieJar,
        mod.delay,
        mod.productId,
        mod.quantity,
        cartProducts
    )
    // execute after modification is complete
    .then(function () {
        // peform next modification
        if (++modNum < testPlan.numMod) {
            return modifyCartProducts(cartId, cookieJar, testPlan, modNum, cartProducts)
        }
        // if all planned modifications have been performed then complete
        else {
            return Promise.resolve()
        }
    })
}

function modifyCartProduct (cartId, cookieJar, delay, productId, quantity, cartProducts) {
    // url and method are determined by whether or not this is the first entry for the product
    var method, url
    // product already has a cart product
    if (cartProducts[productId]) {
        // do a put to the cart product url
        method = 'PUT'
        url = '/cart/'+cartId+'/cartProduct/'+cartProducts[productId]
    }
    // this is first request for product id
    else {
        // do a post
        method = 'POST'
        url = '/cart/'+cartId+'/cartProduct'
    }
    // create promise that will be resolved when request complete
    return new Promise(function (resolve) {
        // perform request after delay
        setTimeout(function () {
            var body = {
                productId: productId,
                quantity: quantity
            }
            // make request
            var requestPromise = method === 'POST'
                ? post(cookieJar, url, body)
                : put(cookieJar, url, body)
            // after request completes process response to get new cart product id
            requestPromise.then(function (res) {
                // set cart product id for product
                cartProducts[productId] = res.cartProduct.cartProductId
                // resolve outer promise
                resolve(res)
            })
        }, delay)
    })    
}

function runTest () {
    // get test plan
    var testPlan = testPlans[started]
    // keep track of tests started
    started++
    // add current test to in flight count
    inflight++

    // store cookies between requests
    var cookieJar = request.jar()

    // map of product ids to cart product ids
    var cartProductIds = {}

    // capture variables to pass between steps
    var cartId

    requestCount++

    // request base URL to get session
    get(cookieJar, '/')
    // request cart
    .then(function () {
        return get(cookieJar, '/cart')
    })
    // add and remove product from cart
    .then(function (res) {
        // no cart returned
        if (!(res && res.cartId)) {
            return Promise.reject("could not get cart")
        }
        // capture cartId for use in later steps
        cartId = res.cartId
        // perform a variable number of product modifications
        return modifyCartProducts(cartId, cookieJar, testPlan, 0, cartProductIds)
    })
    .then(function (res) {
        // perform tests
        return validateTestPlan(cartId, cookieJar, testPlan, cartProductIds)
    })
    .then(function (res) {
        // update program counters
        inflight--
        run++
    })
    .catch(function (err) {
        console.log(err)
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

function validateTestPlan (cartId, cookieJar, testPlan, cartProductIds) {
    var i, testPlanProducts = {}
    // calculate quantity sums for test plan products
    for (i=0; i < testPlan.mods.length; i++) {
        var mod = testPlan.mods[i]
        // create entry for each product
        if (!testPlanProducts[mod.productId]) {
            testPlanProducts[mod.productId] = 0
        }
        // update quantity
        testPlanProducts[mod.productId] += mod.quantity
    }
    // get all product ids
    var productIds = Object.keys(testPlanProducts)
    // validate that all product ids got a cart product
    for (i=0; i < productIds.length; i++) {
        var productId = productIds[i]
        // check if cart product id is set
        if (!cartProductIds[productId]) {
            console.log('TEST ERROR: cart product id not found for '+productId)
            testErrors++
            return
        }
    }
    // build cart url
    var url = '/cart/'+cartId
    // get current cart
    return get(cookieJar, url)
    // validate product cound
    .then(function (res) {
        // get products
        var cartProducts = res.products
        // check quantity for each product
        for (var i=0; i < productIds.length; i++) {
            var productId = productIds[i]
            // find product entry in products
            var cartProduct = findCartProductByProductId(cartProducts, productId)
            // check that cart product was found
            if (!cartProduct) {
                console.log('TEST ERROR: cart product not found for '+productId)
                testErrors++
                return
            }
            // check that quantity matches
            if (testPlanProducts[productId] !== cartProduct.quantity) {
                console.log('TEST ERROR: quantity did not match for '+productId)
                testErrors++
                return
            }
            // delete cart product after verification
            delete cartProducts[cartProduct.originalCartProductId]
        }
        // all cart prodcuts should have been deleted
        if (Object.keys(cartProducts).length) {
            console.log('TEST ERROR: extra cart products')
            testErrors++
            return
        }
    })
}

/* test helper functions */

function findCartProductByProductId (cartProducts, productId) {
    // get all cart product ids
    var cartProductIds = Object.keys(cartProducts)
    // iterate over cart products looking for product id
    for (var i=0; i < cartProductIds.length; i++) {
        var cartProductId = cartProductIds[i]
        var cartProduct = cartProducts[cartProductId]
        // return cart product if product id matches
        if (cartProduct.productId === productId) {
            return cartProduct
        }
    }
}


/* program functions */

function finish () {
    process.exit()
}

function printHelp () {
    console.log("\nUsage: node test/procedural-test.js [options]\n")
    console.log("\t--avgDelay\t[10000]\t\taverage time between requests (ms)")
    console.log("\t--avgMod\t[15]\t\taverage product modifications (add+remove)")
    console.log("\t--baseUrl\t[http://marketplace.dev:9077]")
    console.log("\t--concurrent\t[1000]\t\tnumber of tests to run concurrently")
    console.log("\t--number\t[1000]\t\ttotal number of tests to run")
    console.log("\n")
}

function printStatus () {
    var curTime = new Date().getTime();
    var runTime = curTime - runStartTime;

    var message = successCount + ' reqs; ' + parseInt(successCount / (runTime / 1000)) + ' tot rps'

    // calculate rps for last iteration only
    if (lastCount && lastTime) {
        message += '; ' + parseInt((successCount - lastCount) / ((curTime - lastTime) / 1000)) + ' cur rps'
    }
    // calculate avg request time
    if (timeCount > 0) {
        message += '; ' + (timeSum / timeCount).toFixed(2) + 'ms avg'
    }

    message += '; ' + errorCount + ' req err'

    message += '; ' + testErrors + ' test err'

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

function createTestPlan () {
    var testPlan = {}
    // products to be modified by this test plan
    testPlan.products = []
    // list of product modifications to perform
    testPlan.mods = []
    // number of product modifications to perform
    testPlan.numMod = getRandom(options.avgMod - 5, options.avgMod + 5)
    // create specification for modifications to be performed
    for (var i=0; i < testPlan.numMod; i++) {
        // specification for product modification
        var mod = {};
        // number of ms to delay beofre making request
        mod.delay = getRandom(options.avgDelay - (options.avgDelay * .25), options.avgDelay + (options.avgDelay * .25))
        // if some products have already been modified in this test iteration then
        // either modify an existing product again or modify a new product
        if (testPlan.products.length && getRandom(0, 1)) {
            // get a random product from products already modified
            mod.productId = testPlan.products[ getRandom(0, testProducts.length - 1) ]
            // quantity can be either positive or negative on existing product
            mod.quantity = getRandom(-2, 5)
        }
        // get new product
        else {
            // get a random product from global product list
            mod.productId = products[ getRandom(0, products.length - 1) ]
            // always positive on new product
            mod.quantity = getRandom(1, 5)
        }
        // add specification to list
        testPlan.mods.push(mod)
    }

    return testPlan
}

function createTestPlans () {
    var testPlans = []

    for (var i=0; i < options.number; i++) {
        testPlans[i] = createTestPlan()
    }

    return testPlans
}

function generateProductIds () {
    return get({}, '/product').then(function (res) {
        // add product ids to global list for use in tests
        for (var i=0; i < res.length; i++) {
            products.push(res[i].productId)
        }
    })
}

function getRandom (min, max) {
    return Math.floor(rng()*(max-min+1)+min);
}