'use strict'

var ImmutableModule = require('./immutable/module')

// static functions
var Immutable = {}

/* exported functions */

// create or return an immutable controller
Immutable.controller = function controller (name, spec) {
    // throw error on invlaid name
    requireValidName(name)
    // append Controller to name to get unique module name
    name = name + 'Controller'
    // return controller module
    return ImmutableModule(name, spec)    
}

// create or return an immutable model
Immutable.model = function model (name, spec) {
    // throw error on invlaid name
    requireValidName(name)
    // append Model to name to get unique module name
    name = name + 'Model'
    // return model module
    return ImmutableModule(name, spec)  
}

/* private functions */

function requireValidName (name) {
    // require valid name
    if (name && typeof name === 'string' && name.length > 0) {
        return true
    }
    else {
        throw new Error('valid name required')
    }
}

module.exports = Immutable