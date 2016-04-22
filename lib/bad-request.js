'use strict'

/* public functions */
module.exports = badRequest

function badRequest (message, data) {
    if (typeof message === 'undefined') {
        message = 'Bad Request'
    }
    var badRequest = new Error(message)
    badRequest.status = 400
    badRequest.data = data
    return Promise.reject(badRequest)
}