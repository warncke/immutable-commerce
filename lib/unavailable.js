'use strict'

/* public functions */
module.exports = unavailable

function unavailable (message) {
    if (typeof message === 'undefined') {
        message = "Service Unavailable"
    }
    var unavailable = new Error(message)
    unavailable.status = 503
    return Promise.reject(unavailable)
}