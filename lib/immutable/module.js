'use strict'

/* npm modules */
var isObject = require('isobject')

/* application modules */
var log = require('../log')
var microTimestamp = require('../micro-timestamp')
var objectType = require('../object-type')
var stableId = require('../stable-id')
var stableIdWithData = require('../stable-id-with-data')

// global private meta data
var meta = {}
// global module register
var modules = {}

/* public functions */
module.exports = ImmutableModule

function ImmutableModule (moduleName, spec) {
    // module has already been instantiated
    if (modules[moduleName]) {
        // do not allow double specification
        if (spec) {
            throw new Error('module '+moduleName+' already specified')
        }
    }
    // instantiate module if spec passed
    else if (spec) {
        modules[moduleName] = new Module(moduleName, spec)
    }
    // return singleton module instance
    return modules[moduleName]
}

/* private functions */

/**
 * @function Module
 *
 * @param {string} moduleName - unique module name
 * @param {object} spec - module functions
 */
function Module (moduleName, spec) {
    // do not allow double specification
    if (meta[moduleName]) {
        throw new Error('module '+moduleName+' already specified')
    }
    // create meta data entry for module
    var moduleMeta = meta[moduleName] = {}
    // spec must consist of name: function pairs
    var functionNames = Object.keys(spec)
    // create wrapper functions for each named function
    for (var i=0; i < functionNames.length; i++) {
        var functionName = functionNames[i]
        var functionObj = spec[functionName]
        // do not allow double specification
        if (this[functionName]) {
            throw new Error('function '+functionName+' already specified for module '+moduleName)
        }
        // require function
        if (typeof functionObj !== 'function') {
            throw new Error('function required for '+moduleName+'.'+functionName)
        }
        // create meta data entry for function
        var functionMeta = moduleMeta[functionName] = {
            functionName: functionName,
            functionObj: functionObj,
            functionSignature: moduleName+'.'+functionName,
            moduleName: moduleName,
        }
        // create wrapper function
        this[functionName] = createWrapperFunction(functionMeta)
    }
}

Module.prototype = {
    bind: bind,
}

// valid bind methods
var bindMethods = {
    'after': true,
    'afterDetach': true,
    'before': true,
    'beforeDetach': true,
}

/**
 * @function bind
 *
 * @param {string} method - when and how to bind
 * @param {string} moduleName -  module to bind to
 * @param {string} functionName - function to bind to
 * @param {string} functionObj - function to bind
 */
function bind (method, moduleName, functionName, functionObj) {
    // require module to bind to
    if (!meta[moduleName]) {
        throw new Error('module '+moduleName+' not defined')
    }
    // get module meta data
    var moduleMeta = meta[moduleName]
    // require function to bind to
    if (!moduleMeta[functionName]) {
        throw new Error('function '+functionName+' not defined')
    }
    // get function meta data for function to bind to
    var functionMeta = moduleMeta[functionName]
    // require valid bind method
    if (!bindMethods[method]) {
        throw new Error('invalid bind method '+method)
    }
    // require function to bind
    if (!(typeof functionObj === 'function')) {
        throw new Error('must bind a function')
    }
    // only bind functions that are part of immutable modules
    if (!functionObj.meta) {
        throw new Error('cannot bind non-module function')
    }
    // create call queue for method if it does not already exist
    if (!functionMeta[method]) {
        functionMeta[method] = []
    }
    // add function to call queue
    functionMeta[method].push(functionObj)
}

/**
 * @function createWrapperFunction
 *
 * @param {object} functionMeta - function meta data
 */
function createWrapperFunction (functionMeta) {
    return log.ENABLED && log.LOG_CALLS
        // create wrapper function with call logging
        ? createLoggedWrapperFunction(functionMeta)
        // create wrapper function without call logging
        : createUnloggedWrapperFunction(functionMeta)
}

/**
 * @function createLoggedWrapperFunction
 *
 * @param {object} functionMeta - function meta data
 */
function createLoggedWrapperFunction (functionMeta) {
    // all module functions must have the same signature - a single
    // object with 0 or more named parameters
    var functionObj = function (args) {
        // log call
        var moduleCallId = logCall(functionMeta, args)
        // run any before detached extensions
        if (functionMeta.beforeDetach) {
            runBeforeDetachLogged(functionMeta, args, moduleCallId)
        }
        // if there are extensions that must be run before the actual
        // call then wait for promise to be resolved
        if (functionMeta.before) {
            // run extensions bound to before method
            return runBeforeLogged(functionMeta, args, moduleCallId)
            // call the original function with the ars as the value resolved from
            // the before methods
            .then(function (args) {
                // call target function
                var ret = (functionMeta.functionObj)(args)
                // run any after detached extensions
                if (functionMeta.afterDetach) {
                    runAfterDetachLogged(functionMeta, args, ret, moduleCallId)
                }
                // if there are extensions that must be run after the return which
                // will modify the return then return that promise instead of the
                // original return promise
                if (functionMeta.after) {
                    // run extensions bound to after methods
                    var after = runAfterLogged(functionMeta, args, ret, moduleCallId)
                    // allow logger to modify ret to inject into promise chains
                    after = logReturn(moduleCallId, args, after)
                    // return original return data
                    return after
                }
                // no block extensions after so return original return
                else {
                    // allow logger to modify ret to inject into promise chains
                    ret = logReturn(moduleCallId, args, ret)
                    // return original return data
                    return ret
                }
            })
        }
        // run target function immediately
        else {
            // call target function
            var ret = (functionMeta.functionObj)(args)
            // run any after detached extensions
            if (functionMeta.afterDetach) {
                runAfterDetachLogged(functionMeta, args, ret, moduleCallId)
            }
            // if there are extensions that must be run after the return which
            // will modify the return then return that promise instead of the
            // original return promise
            if (functionMeta.after) {
                // run extensions bound to after methods
                var after = runAfterLogged(functionMeta, args, ret, moduleCallId)
                // allow logger to modify ret to inject into promise chains
                after = logReturn(moduleCallId, args, after)
                // return original return data
                return after
            }
            // no block extensions after so return original return
            else {
                // allow logger to modify ret to inject into promise chains
                ret = logReturn(moduleCallId, args, ret)
                // return original return data
                return ret
            }
        }
    }
    // store meta data on function
    functionObj.meta = functionMeta
    // return newly created function
    return functionObj
}

 /**
 * @function createUnloggedWrapperFunction
 *
 * @param {object} functionMeta - function meta data
 */
function createUnloggedWrapperFunction (functionMeta) {
    // all module functions must have the same signature - a single
    // object with 0 or more named parameters
    var functionObj = function (args) {
        // call target function
        var ret = (functionMeta.functionObj)(args)
        // return original return data
        return ret
    }
    // store meta data on function
    functionObj.meta = functionMeta
    // return newly created function
    return functionObj
}

/**
 * @function logCall
 *
 * @param {object} functionMeta - function meta data
 * @param {object} args - original caller args
 */
function logCall(functionMeta, args) {
    try {
        // session must be passed as args or as param to args
        var session = args.session
        // args id and data if any
        var argsId
        // args are a request
        if (args.requestId) {
            // get only the inputs relevant to controller
            argsId = stableIdWithData({
                body: args.body,
                params: args.params,
                query: args.query,
            })
            // log args data
            log.data(argsId)
            // capture id only
            argsId = argsId.dataId
        }
        // treat args as plain ref
        else {
            // clear session to avoid cicular refs
            args.session = undefined
            // get args data
            argsId = stableIdWithData(args)
            // reset session
            args.session = session
            // log args data
            log.data(argsId)
            // capture id only
            argsId = argsId.dataId
        }
        // stack id if any
        var stackId
        // if there are calls on stack then save stack
        if (session.stack.length) {
            // get id
            stackId = stableIdWithData(session.stack)
            // log data
            log.data(stackId)
            // capture id only
            stackId = stackId.dataId
        }
        // build call data
        var moduleCallData = {
            argsId: argsId,
            callNumber: session.callCount++,
            functionName: functionMeta.functionName,
            moduleCallCreateTime: microTimestamp(),
            moduleName: functionMeta.moduleName,
            requestId: session.req.requestId,
            stackId: stackId,
        }
        // get id
        var moduleCallId = moduleCallData.moduleCallId = stableId(moduleCallData)
        // log module call
        log.moduleCall(moduleCallData)
        // store call id in session for query and request logging
        session.moduleCallId = moduleCallId
        // add current call to call stack
        args.session.stack.push(functionMeta.functionSignature)
        // return module call id so return and promise complete can reference it
        return moduleCallId
    }
    catch (err) {
        // log errors
        log.error(err)
    }
}

/**
 * @function logReturn
 *
 * @param {string} moduleCallId - hex id of call
 * @param {object} args - original args
 * @param {object} ret - original return
 */
function logReturn (moduleCallId, args, ret) {
    try {
        // remove current call from stack
        args.session.stack.pop()
        // inject logger into promise chain
        return ret.then(function (res) {
            // get id for promise data
            var promiseDataId = stableIdWithData(res)
            // log data
            log.data(promiseDataId)
            // log promise
            log.moduleCallPromise({
                moduleCallId: moduleCallId,
                promiseDataId: promiseDataId.dataId,
                resolved: 1,
                moduleCallPromiseCreateTime: microTimestamp(),
            })
            // pass success back along promise chain
            return res
        }).catch(function (err) {
            // get id for promise data
            var promiseDataId = stableIdWithData(err)
            // log data
            log.data(promiseDataId)
            // log promise
            log.moduleCallPromise({
                moduleCallId: moduleCallId,
                promiseDataId: promiseDataId.dataId,
                resolved: 0,
                moduleCallPromiseCreateTime: microTimestamp(),
            })
            // pass error back along promise chain
            return Promise.reject(err)
        })
    }
    catch (err) {
        // log errors
        log.error(err)
        // return original return value on error
        return ret
    }
}

/**
 * @mergeResult
 *
 * @param {*} varA - first variable to merge
 * @param {*} varB - second variable to merge
 * @param {string} type - variable type
 */
 function mergeResult (varA, varB, type) {
    console.log(varA)
    console.log(varB)
    console.log(type)
    // simple object
    if (type === 'object') {
        // get all properties set on object b
        var keys = Object.keys(varB)
        // shallow merge into object a
        for (var i=0; i < keys.length; i++) {
            var key = keys[i]
            // set object a value from object b - this
            // overwrites any value set on object a
            varA[key] = varB[key]
        }
        // return modified object a
        return varA
    }
    // array
    else if (type === 'array') {
        // add all values from array b to array a
        for (var i=0; i < varB.length; i++) {
            varA.push(varB[i])
        }
        // return modified array a
        return varA
    }
    // everything else
    else {
        // var b simply overrides var a - this will not work
        // with multiple extensions on the same method since
        // they will all clobber each other
        return varB
    }
 }

/**
 * @function runAfterLogged
 */
function runAfterLogged (functionMeta, args, originalRet, moduleCallId) {
    // make sure original return value is a promise
    if (!(originalRet && originalRet.then)) {
        originalRet = Promise.resolve(originalRet)
    }
    // after original promise returns then run after methods
    return originalRet.then(function (res) {
        // result type - must match extension result types to merge
        var resultType = objectType(res)
        // promises for all extensions to be run
        var promises = []
        // run all functions
        for (var i=0; i < functionMeta.after.length; i++) {
            var functionObj = functionMeta.after[i]
            // call function with result from original promise resolution
            var promise = (functionObj)({args: args, res: res, session: args.session})
            // make sure we have a promise
            if (!(promise && promise.then)) {
                promise = Promise.resolve(promise)
            }
            // and promise to list to wait on
            promises.push(promise)
        }
        // wait for all extension methods to complete
        return Promise.all(promises)
        // merge returned data into original
        .then(function (results) {
            // merge each after result into origin result
            for (var i=0; i < results.length; i++) {
                var result = results[i]
                // get result type for extension - must match original return value
                var extensionResultType = objectType(result)
                // result types match - merge results
                if (resultType === extensionResultType) {
                    mergeResult(res, result, resultType)
                }
                // result types do not match
                else {
                    // if original result was undefined then allow extension to set
                    // its return value and type - which will then apply to any other
                    // extensions
                    if (resultType === 'undefined') {
                        // this extensions result becomes the new result
                        res = result
                        // set the new type
                        resultType = extensionResultType
                    }
                    // non matching results cannot be merged
                    else {
                        // log error
                    }
                }
            }
            // return merged result
            return res
        })
    })
}

/**
 * @function runAfterDetachLogged
 */
function runAfterDetachLogged (functionMeta, args, ret, moduleCallId) {
    // run all functions
    for (var i=0; i < functionMeta.afterDetach.length; i++) {
        var functionObj = functionMeta.afterDetach[i]
        // call function on next tick
        runAfterDetachLoggedNextTick(functionObj, args)
    }
}

/**
 * @function runAfterDetachLoggedNextTick
 */
function runAfterDetachLoggedNextTick (functionObj, args) {
    // run function after all current processing complete
    process.nextTick(function () {
        // call function
        (functionObj)(args)
    })
}

/**
 * @function runBeforeDetachLogged
 */
function runBeforeDetachLogged (functionMeta, args, ret, moduleCallId) {
    // run all functions
    for (var i=0; i < functionMeta.beforeDetach.length; i++) {
        var functionObj = functionMeta.beforeDetach[i]
        // call function on next tick
        runBeforeDetachLoggedNextTick(functionObj, args)
    }
}

/**
 * @function runBeforeDetachLoggedNextTick
 */
function runBeforeDetachLoggedNextTick (functionObj, args) {
    // run function before all current processing complete
    process.nextTick(function () {
        // call function
        (functionObj)(args)
    })
}

/**
 * @function runBefore
 */
function runBeforeLogged (functionMeta, args, moduleCallId) {
    // promises for all before methods that must be resolved
    // before calling original function
    var promises = []
    // run all functions
    for (var i=0; i < functionMeta.before.length; i++) {
        var functionObj = functionMeta.before[i]
        // call function with result from original promise resolution
        var promise = (functionObj)(args)
        // make sure we have a promise
        if (!(promise && promise.then)) {
            promise = Promise.resolve(promise)
        }
        // and promise to list to wait on
        promises.push(promise)
    }
    // wait for all extension methods to complete
    return Promise.all(promises)
    // merge returned data into original
    .then(function (results) {
        // merge each before result into original args
        for (var i=0; i < results.length; i++) {
            var result = results[i]
            // if extension did not return any value, skip
            if (result === undefined) {
                continue
            }
            // return must be a simple object
            if (isObject(result)) {
                // merge extension return value into args
                mergeResult(args, result, 'object')
            }
            else {
                // log error
            }
        }
        // return merged result
        return args
    })
}