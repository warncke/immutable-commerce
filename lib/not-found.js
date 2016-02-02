'use strict'

function notFound (message) {
    if (typeof message === 'undefined') {
        message = "Not Found"
    }
    var notFound = new Error(message)
    notFound.status = 404
    return notFound
}

module.exports = notFound