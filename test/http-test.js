'use strict'

/* npm libraries */
var assert = require("assert");
var commandLineArgs = require("command-line-args")

/* application libraries */
var http = require('../lib/http')

/* CLI setup */

var cli = commandLineArgs([
    { name: "baseUrl", type: String, defaultValue: "http://marketplace.dev:9077" },
    { name: "help", type: Boolean, defaultValue: false },
])

var options = cli.parse()

// show help and exit
if (options.help) {
    printHelp()
    process.exit()
}

// build fake session
var session = {
    moduleCallId: '1111',
    req: {
        requestId: '2222'
    }
}

// cookie jar to share between requests
var jar = {}

// test different http methods
http.get(
    options.baseUrl,
    {jar: jar},
    session
)
// handle response
.then(function (res) {
    console.log(res)
    console.log(jar)
    // request page with body parsed
    return http.get(
        options.baseUrl,
        {
            jar: jar,
            json: true,
        },
        session
    )
})
// handle response
.then(function (res) {
    console.log(res)
    // make a bad request
    return http.get(
        'xxx://yyy',
        {
            jar: jar,
            json: true,
        },
        session
    )
})
// request should reject
.catch(function (err) {
    //console.log(err)
})
// make another request
.then(function () {
    // make a 404 request
    return http.get(
        options.baseUrl + '/asdfadsfasdfasdfasfd',
        {
            jar: jar,
            json: true,
        },
        session
    )
})
// handle response
.then(function (res) {
    console.log(res)
})
// exit when done
.finally(function () {
    // wait for database queries to finish
    setTimeout(function () {
        process.exit()
    }, 100)
})

/* program functions */

function printHelp () {
    console.log("\nUsage: node test/http-test.js [options]\n")
    console.log("\t--baseUrl\t[http://marketplace.dev:9077]")
    console.log("\n")
}