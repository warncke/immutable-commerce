'use strict'

/* npm modules */
var moment = require('moment')

/* application modules */
var log = require('../log')
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
            moduleCallId = logCall(functionMeta, args)
        }
        // call target function
        var ret = (functionMeta.functionObj)(args)
        // log return if logging enabled
        if (log.ENABLED && log.LOG_CALLS) {
            // allow logger to modify ret to inject into promise chains
            ret = logReturn(args, moduleCallId, ret)
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
    var session = args.session ? args.session : args
    // require request and request id to be set
    if (!(session.req && session.req.requestId)) {
        throw new Error('call without request to '+functionMeta.functionSignature)
    }
    // args id and data if any
    var argsId
    // if there were args other than a session then record then
    if (args.session) {
        // remove session from args
        args.session = undefined
        // get args data and id
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
        moduleCallCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
        moduleName: functionMeta.moduleName,
        requestId: session.req.requestId,
        stackId: stackId,
    }
    // get id
    var moduleCallId = moduleCallData.moduleCallId = stableId(moduleCallData)
    // log module call
    log.moduleCall(moduleCallData)
    // add function to call stack
    session.stack.push(functionMeta.functionSignature)
    // return module call id so return and promise complete can reference it
    return moduleCallId
}

/**
 * @function logReturn
 *
 * @param {string} moduleCallId - hex id of call
 * @param {object} ret - original return
 */
function logPromise (moduleCallId, ret) {
    // return promise with logger injected
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
            moduleCallPromiseCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
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
            moduleCallPromiseCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
        })
        // pass error back along promise chain
        return Promise.reject(err)
    })
}

/**
 * @function logReturn
 *
 * @param {object} args - original caller args
 * @param {string} moduleCallId - hex id of call
 * @param {object} ret - original return
 */
function logReturn (args, moduleCallId, ret) {
    // session must be passed as args or as param to args
    var session = args.session ? args.session : args
    // return data id - undefined for promise
    var returnDataId
    // if response is a promise the log return once promise is resolved
    if (typeof ret === 'object' && ret.then) {
        // log promise result when it is resolved or rejected
        ret = logPromise(moduleCallId, ret)
    }
    // log return data
    else {
        // get id and data for return data
        var returnId = stableIdWithData(ret)
        // log return data
        log.data(returnId)
        // capture data id
        returnDataId = returnId.dataId
    }
    // build call return data
    var moduleCallReturnData = {
        moduleCallReturnCreateTime: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS'),
        moduleCallId: moduleCallId,
        returnDataId: returnDataId,
    }
    // log call return
    log.moduleCallReturn(moduleCallReturnData)
    // remove last entry from call stack
    session.stack.pop()
    // return original return data
    return ret;
}