'use strict'

var ImmutableModule = require('./immutable/module')

/* public functions */
module.exports = {
    after: after,
    afterDetach: afterDetach,
    before: before,
    beforeDetach: beforeDetach,
    controller: controller,
    extension: extension,
    getMethod: getMethod,
    model: model,
}

/* exported functions */

/**
 * @function after
 *
 * @oaram {string} targetFunctionSignature - moduleName.functionName to bind to
 * @param {function} functionObj - function to bind
 */
function after (targetFunctionSignature, functionObj) {
    return bind('after', targetFunctionSignature, functionObj)
}

/**
 * @function afterDetach
 *
 * @oaram {string} targetFunctionSignature - moduleName.functionName to bind to
 * @param {function} functionObj - function to bind
 */
function afterDetach (targetFunctionSignature, functionObj) {
    return bind('afterDetach', targetFunctionSignature, functionObj)
}

/**
 * @function before
 *
 * @oaram {string} targetFunctionSignature - moduleName.functionName to bind to
 * @param {function} functionObj - function to bind
 */
function before (targetFunctionSignature, functionObj) {
    return bind('before', targetFunctionSignature, functionObj)
}

/**
 * @function beforeDetach
 *
 * @oaram {string} targetFunctionSignature - moduleName.functionName to bind to
 * @param {function} functionObj - function to bind
 */
function beforeDetach (targetFunctionSignature, functionObj) {
    return bind('beforeDetach', targetFunctionSignature, functionObj)
}

/**
 * @function controller
 *
 * @param {string} name - name of controller
 * @param {object} spec - object containing controller functions
 *
 * @returns {object} - object containing wrapped controller functions
 */
function controller (name, spec) {
    // throw error on invlaid name
    requireValidName(name)
    // append Controller to name to get unique module name
    name = name + 'Controller'
    // return controller module
    return getModule(name, spec)
}

/**
 * @function extension
 *
 * @param {string} name - name of extension
 * @param {object} spec - object containing extension functions
 *
 * @returns {object} - object containing wrapped controller functions
 */
function extension (name, spec) {
    // throw error on invlaid name
    requireValidName(name)
    // append Controller to name to get unique module name
    name = name + 'Extension'
    // return controller module
    return getModule(name, spec)
}

/**
 * @function model
 *
 * @param {string} name - name of model
 * @param {object} spec - object containing model functions
 *
 * @returns {object} - object containing wrapped model functions
 */
function model (name, spec) {
    // throw error on invlaid name
    requireValidName(name)
    // append Model to name to get unique module name
    name = name + 'Model'
    // return model module
    return getModule(name, spec)
}

/**
 * @function getMethod
 *
 * @param {string} signature - ModuleName.FunctionName of method
 *
 * @returns {function} - method function
 */
function getMethod (signature) {
    // convert signature string to method and function name
    // throws error on invalid name
    signature = requireValidSignature(signature)
    // get module
    var module = ImmutableModule(signature.moduleName)
    // throw error if module not defined
    if (!module) {
        throw new Error('module not found '+signature.moduleName)
    }
    // get function
    var method = module[signature.functionName]
    // throw error if function not defined
    if (!method) {
        throw new Error('method not found '+signature.full)
    }
    // return wrapper function that can be used to invoke method
    return method
}

/**
 * @function getModule
 *
 * @param {string} name - name of module
 * @param {object} spec - object containing module functions
 *
 * @returns {object} - object containing wrapped module functions
 */
function getModule (name, spec) {
    // throw error on invalid name
    requireValidName(name)
    // create module
    var module = ImmutableModule(name, spec)
    // bind any deferred binds
    bindDeferred(name, module)
    // return module
    return module
}

/* private functions */

// store of functions to be bound to modules if/when they are created
var deferredBind = {}

/**
 * @function bind
 *
 * @param {string} method - when and how to bind
 * @param {string} targetFunctionSignature - moduleName.functionName to bind to
 * @param {function} functionObj - function to bind
 */
function bind (method, targetFunctionSignature, functionObj) {
    // validate signature
    var signature = requireValidSignature(targetFunctionSignature)
    // try to get module
    var module = ImmutableModule(signature.moduleName)
    // if module already exists then bind function
    if (module) {
        module.bind(method, signature.moduleName, signature.functionName, functionObj)
    }
    // if module does not exist yet it still may be created later so
    // add function to list to be bound if/when module is created
    else {
        // create deferred bind entry for mdoule
        if (!deferredBind[signature.moduleName]) {
            deferredBind[signature.moduleName] = {}
        }
        // create deferred bind entry for function
        if (!deferredBind[signature.moduleName][signature.functionName]) {
            deferredBind[signature.moduleName][signature.functionName] = {}
        }
        // create deferred bind entry for method type
        if (!deferredBind[signature.moduleName][signature.functionName][method]) {
            deferredBind[signature.moduleName][signature.functionName][method] = []
        }
        // add function to list of deferred binds
        deferredBind[signature.moduleName][signature.functionName][method].push(functionObj)
    }
}

/**
 * @function bindDeferred
 *
 * @param {string} moduleName - name of module
 * @param {object} module - module
 */
function bindDeferred (moduleName, module) {
    // return unless there are deferred binds to process
    if (!deferredBind[moduleName]) {
        return
    }
    // get all function names for deferred binds
    var functionNames = Object.keys(deferredBind[moduleName])
    // bind methods for each module function
    for (var i=0; i < functionNames.length; i++) {
        var functionName = functionNames[i]
        // get all methods for module function
        var methods = Object.keys(deferredBind[moduleName][functionName])
        // bind functions for all methods
        for (var j=0; j < methods.length; j++) {
            var method = methods[j]
            // get list of functions to bind
            var functionObjs = deferredBind[moduleName][functionName][method]
            // bind all functions
            for (var k=0; k < functionObjs[k]; k++) {
                var functionObj = functionObjs[k]
                // bind function
                module.bind(method, moduleName, functionName, functionObj)
            }
        }
    }
}

/**
 * @function requireValidName
 *
 * @param {string} name - name to be evaluated for validity
 *
 * @returns {true} - on valid name
 * @throws on invalid name
 */
function requireValidName (name) {
    // require valid name
    if (name && typeof name === 'string' && name.length > 0) {
        return true
    }
    else {
        throw new Error('valid name required')
    }
}

/**
 * @function requireValidSignature
 *
 * @param {string} signature - function signature to be evaluated
 *
 * @returns {object} - moduleName, functionName
 * @throws on invalid signature
 */
 function requireValidSignature (signature) {
    // require string
    if (typeof signature !== 'string') {
        throw new Error('signature must be string')
    }
    // split function signature into moduleName and functionName
    var parts = signature.split('.')
    // require two parts
    if (parts.length !== 2) {
        throw new Error('invalid signature '+signature)
    }
    // module name is first part
    var moduleName = parts[0]
    // function name is second part
    var functionName = parts[1]
    // require names to be valid
    try {
        requireValidName(moduleName)
        requireValidName(functionName)
    }
    catch (ex) {
        throw new Error('invalid signature '+signature)
    }
    // return module and function name
    return {
        full: signature,
        functionName: functionName,
        moduleName: moduleName,
    }
 }