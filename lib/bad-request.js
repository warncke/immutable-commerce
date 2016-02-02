'use strict'

function badRequest (message) {
    if (typeof message === 'undefined') {
        message = 'Bad Request'
    }
    var badRequest = new Error(message)
    badRequest.status = 400
    return badRequest
}

module.exports = badRequest