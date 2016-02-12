'use strict'

/* npm modules */

/* application modules */
var log = require('../log')
var microTimestamp = require('../micro-timestamp')
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
    // instantiate module
    else {
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

/**
 * @function createWrapperFunction
 *
 * @param {object} functionMeta - function meta data
 */
function createWrapperFunction (functionMeta) {
    // all module functions must have the same signature - a single
    // object with 0 or more name parameters
    return function (args) {
        // call id - set if call logging enabled
        var moduleCallId;
        // log call if logging enabled
        if (log.ENABLED && log.LOG_CALLS) {
            // log call
            try {
                moduleCallId = logCall(functionMeta, args)
            }
            catch (err) {
                // add logging on log errors
            }
            // add current call to stack
            try {
                args.session.stack.push(functionMeta.functionSignature)
            }
            catch (err) {
                // add logging on log errors
            }
        }
        // call target function
        var ret = (functionMeta.functionObj)(args)
        // log return if logging enabled and return is a promise
        if (log.ENABLED && log.LOG_CALLS) {
            // allow logger to modify ret to inject into promise chains
            try {
                if (ret) {
                    ret = logPromise(moduleCallId, ret)
                }
            }
            catch (err) {
                // add logging on log errors
            }
            // remove current call from stack
            try {
                args.session.stack.pop()
            }
            catch (err) {
                // add logging on log errors
            }
        }
        // return original return data
        return ret
    }
}

/**
 * @function logCall
 *
 * @param {object} functionMeta - function meta data
 * @param {object} args - original caller args
 */
function logCall(functionMeta, args) {
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
    // return module call id so return and promise complete can reference it
    return moduleCallId
}

/**
 * @function logPromise
 *
 * @param {string} moduleCallId - hex id of call
 * @param {object} ret - original return
 */
function logPromise (moduleCallId, ret) {
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