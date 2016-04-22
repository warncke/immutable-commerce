'use strict'

/* public functions */
module.exports = redirect

function redirect (url, code) {
    if (typeof url === 'undefined') {
        url = '/'
    }
    if (typeof code === 'undefined') {
        code = 302
    }
    // redirect
    return Promise.reject({
        status: code,
        url: url
    })
}