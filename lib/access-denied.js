'use strict'

function accessDenied (message) {
    if (typeof message === 'undefined') {
        message = "Access Denied"
    }
    var accessDenied = new Error(message)
    accessDenied.status = 403
    return accessDenied
}

module.exports = accessDenied