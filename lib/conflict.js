'use strict'

/* public functions */
module.exports = conflict

function conflict (data) {
    var badRequest = new Error('Cannot Update Stale Resource')
    badRequest.status = 409
    badRequest.data = data
    return Promise.reject(badRequest)
}