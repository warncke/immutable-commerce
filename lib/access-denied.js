'use strict'

/* public functions */
module.exports = accessDenied

function accessDenied (message) {
    if (typeof message === 'undefined') {
        message = "Access Denied"
    }
    var accessDenied = new Error(message)
    accessDenied.status = 403
    return Promise.reject(accessDenied)
}