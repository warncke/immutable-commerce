'use strict'

/* public functions */
module.exports = badRequest

function badRequest (message) {
    if (typeof message === 'undefined') {
        message = 'Bad Request'
    }
    var badRequest = new Error(message)
    badRequest.status = 400
    return Promise.reject(badRequest)
}