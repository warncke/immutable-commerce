'use strict'

/* public functions */
module.exports = waitForPromise

/**
 * @function waitForPromise
 *
 * @param {function} waitForFunction - function to wait for value from
 * @param {function} callFunction - function to call when value is received
 * @param {integer} waitTime - time in ms to wait for
 * @param {integer} maxRetry - maximum number to times to retry
 *
 * @returns {Promise}
 */
function waitForPromise (waitForFunction, callFunction, waitTime, maxRetry) {
    // require function
    if (typeof waitForFunction !== 'function') {
        throw new Error('waitForFunction must be function')
    }
    // require function
    if (typeof callFunction !== 'function') {
        throw new Error('callFunction must be function')
    }
    // set default
    if (!(waitTime >= 0)) {
        waitTime = 1
    }
    // set default
    if (!(maxRetry >= 0)) {
        maxRetry = 100
    }
    // keep track of retries
    var retry = 0
    // return promise
    return new Promise(function (resolve, reject) {
        // create function that will be called repeatedly
        // until max retries is reached
        var retryFunction = function () {
            // call function that we are waiting on value from
            var ret = waitForFunction()
            // return is undefined
            if (ret === undefined) {
                if (++retry == maxRetry) {
                    // reject promise if max retries reached
                    reject()
                }
                // call retry function again after timeout
                setTimeout(retryFunction, waitTime)
            }
            // return is defined
            else {
                // call function with value
                var ret2 = callFunction(ret)
                // if return is promise then wait for it to resolve
                if (ret2.then) {
                    ret2.then(function (res) {
                        // resolve with resolution of returned promise
                        resolve(res)
                    })
                }
                // resolve with returned value
                else {
                    resolve(ret2)
                }
            }
        }
        // call function for first time
        retryFunction()
    })

}