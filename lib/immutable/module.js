'use strict'

/* npm modules */
var _ = require('lodash')
var isObject = require('isobject')

/* application modules */
var log = require('../log')
var microTimestamp = require('../micro-timestamp')
var objectType = require('../object-type')
var stableId = require('../stable-id')
var stableIdWithData = require('../stable-id-with-data')
var uniqueId = require('../unique-id')

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
            signature: moduleName+'.'+functionName,
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
    // all module functions must have the same signature - a single
    // object with 0 or more named parameters
    var functionObj = function (args) {
        // require every call to have a session
        if (!args.session) {
            args.session = {}
        }
        // generate module call id
        var idData = uniqueId()
        // store module call id on session for db and http logging
        args.session.moduleCallId = idData.id

        // method is being called in replay mode which should execute
        // the function but use logged data for the responses from all
        // other module calls, db queries, and http requests
        if (args.session.replay) {
            /* NOT WORKING !!!
             *
            // build module call id without logging any data
            var moduleCallId = 'xxx' // getModuleCallId(functionMeta, args)
            // store resolved call id promise
            args.session.moduleCallIdPromise = Promise.resolve(moduleCallId)
            // return previous module call response instead of executing function
            // this skips the execution of extensions which should be reviewed
            if (args.session.replayModuleCall) {
                // load data from log database
                return log.getModuleCallPromise({
                    moduleCallId: moduleCallId,
                })
            }
            // the first call with the replay flag set is the outer function
            // so after this call all other module calls should be replayed
            // instead of executing
            args.session.replayModuleCall = true
            */
        }
        // if non in replay mode then log call
        else {
            // log module call
            log.log('moduleCall', {
                args: args,
                functionName: functionMeta.functionName,
                moduleCallCreateTime: idData.timestamp,
                moduleCallId: idData.id,
                moduleName: functionMeta.moduleName,
                requestId: args.session.requestId,
            })
        }

        // run any before detached extensions
        if (functionMeta.beforeDetach) {
            runBeforeDetach(functionMeta, args)
        }

        // create a promise that will be resolved after any block before
        // extensions are run or resolved immediately with the original args
        var runBeforePromise = functionMeta.before
            ? runBefore(functionMeta, args)
            : Promise.resolve(args)

        // return promise chain that will be resolved once all before promises,
        // target call, and any after promises are resolved
        return runBeforePromise

        // call target function with potentially modified args
        .then(function (args) {
            // call target function - make sure result is promise
            var ret = Promise.resolve( (functionMeta.functionObj)(args) )

            // run any after extensions

            // run any detached functions
            if (functionMeta.afterDetach) {
                runAfterDetach(functionMeta, args, ret)
            }

            // if there are extensions that must be run after the return which
            // will modify the return then return that promise instead of the
            // original return promise
            if (functionMeta.after) {
                // run extensions bound to after methods
                var after = runAfter(functionMeta, args, ret)
                // allow logger to modify ret to inject into promise chains
                after = logReturn(idData.id, args, after)
                // return original return data
                return after
            }
            // no blocking extensions after so return original return
            else {
                // allow logger to modify ret to inject into promise chains
                ret = logReturn(idData.id, args, ret)
                // return original return data
                return ret
            }
        })
    }
    // store meta data on function
    functionObj.meta = functionMeta
    // return newly created function
    return functionObj
}

/**
 * @function logReturn
 *
 * @param {string} moduleCallId - hex id of call
 * @param {object} args - original args
 * @param {object} ret - original return
 */
function logReturn (moduleCallId, args, ret) {
    // do not log replay calls
    if (args.session && args.session.replay) {
        return ret
    }
    // inject logger into promise chain
    return ret.then(function (res) {
        // log return
        log.log('moduleCallResolve', {
            moduleCallId: moduleCallId,
            moduleCallResolveData: res,
            resolved: 1,
            moduleCallResolveCreateTime: microTimestamp(),
        })
        // pass success back along promise chain
        return res
    }).catch(function (err) {
        // log return
        log.log('moduleCallResolve', {
            moduleCallId: moduleCallId,
            moduleCallResolveData: err,
            resolved: 0,
            moduleCallResolveCreateTime: microTimestamp(),
        })
        // pass error back along promise chain
        return Promise.reject(err)
    })

}

/**
 * @function runAfter
 *
 * @param {object} functionMeta
 * @param {object} args
 * @param {object} originalRet
 *
 * @returns {Promise}
 */
function runAfter (functionMeta, args, originalRet) {
    // after original promise returns then run after methods
    return originalRet.then(function (res) {
        // promises for all extensions to be run
        var promises = []
        // build arguments for after methods
        var runAfterArgs = {
            args: args,
            res: res,
            session: args.session,
        }

        // run all functions
        functionMeta.after.forEach(function (functionObj) {
            // call function with result from original promise resolution
            // and original args
            var promise = (functionObj)(runAfterArgs)
            // make sure we have a promise
            if (!(promise && promise.then)) {
                promise = Promise.resolve(promise)
            }
            // and promise to list to wait on
            promises.push(promise)
        })

        // wait for all extension methods to complete
        return Promise.all(promises)
        // merge returned data into original
        .then(function (results) {
            // if original result was not an object then cannot merge
            if (!isObject(res)) {
                return res
            }
            // merge each after result into original result
            results.forEach(function (result) {
                // only merge objects
                if (isObject(result)) {
                    _.merge(res, result)
                }
            })
            // return merged result
            return res
        })
    })
}

/**
 * @function runAfterDetach
 *
 * @param {object} functionMeta
 * @param {object} args
 * @param {object} res
 */
function runAfterDetach (functionMeta, args, res) {
    // build arguments for after methods
    var runAfterArgs = {
        args: args,
        res: res,
        session: args.session,
    }
    // run all functions
    functionMeta.afterDetach.forEach(function (functionObj) {
        // call function after next tick
        process.nextTick(function () {
            // call function
            (functionObj)(runAfterArgs)
        })
    })
}

/**
 * @function runBeforeDetach
 *
 * @param {object} functionMeta
 * @param {object} args
 */
function runBeforeDetach (functionMeta, args) {
    // run all functions
    functionMeta.beforeDetach.forEach(function (functionObj) {
        // call function after next tick
        process.nextTick(function () {
            // call function with original args
            (functionObj)(args)
        })
    })
}

/**
 * @function runBefore
 * @param {object} functionMeta
 * @param {object} args
 *
 * @returns {Promise}
 */
function runBefore (functionMeta, args) {
    // promises for all before methods that must be resolved
    // before calling original function
    var promises = []
    // run all functions
    functionMeta.before.forEach(function (functionObj) {
        // call extension with original args
        var promise = (functionObj)(args)
        // make sure result is a promise
        if (!(promise && promise.then)) {
            promise = Promise.resolve(promise)
        }
        // and promise to list to wait on
        promises.push(promise)
    })

    // wait for all extension methods to complete
    return Promise.all(promises)
    // merge returned data into original
    .then(function (results) {
        // merge each before result into original args
        results.forEach(function (result) {
            // only returned objects are valid for merge
            if (isObject(result)) {
                _.merge(args, result)
            }
        })
        // resolve with merged result
        return args
    })
}