'use strict'

/* public functions */
module.exports = notFound

function notFound (message) {
    if (typeof message === 'undefined') {
        message = "Not Found"
    }
    var notFound = new Error(message)
    notFound.status = 404
    return Promise.reject(notFound)
}