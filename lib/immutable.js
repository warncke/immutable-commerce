'use strict'

// global event register
var events = {}

// static functions
var Immutable = {}

// add event handler
Immutable.on = function on (eventName, eventFunction) {
    if (!(typeof eventName === 'string' && eventName.length > 0)) {
        throw new Error("eventName must be a string")
    }
    if (typeof eventFunction !== 'function') {
        throw new Error("eventFunction must be a function")
    }
    // add event name
    if (!events[eventName]) {
        events[eventName] = []
    }
    // add event handler
    events[eventName].push(eventFunction)
}

// call event handlers
Immutable.trigger = function trigger (eventName, eventData) {
    // get event handlers
    var handlers = events[eventName]
    // nothing to do if no handlers
    if (!(handlers && handlers.length)) {
        return
    }
    // promises to be resolved when all handlers complete
    var promises = []
    // call each handler treating result as promise
    for (var i=0; i < handlers.length; i++) {
        var eventFunction = handlers[i]
        promises.push(
            Promise.resolve( (eventFunction)(eventData) )
        )
    }
    // return promise resolving all handlers
    return Promise.all(promises)
}

module.exports = Immutable