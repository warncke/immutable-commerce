'use string'

/* public functions */
module.exports = newReq

function newReq (args) {
    // build express like request object with the parameters
    // that are guaranteed to be available to controllers
    var req = {}
    // set default keys
    req.body = args.body || {}
    req.cookies = args.cookies || {}
    req.params = args.params || {}
    req.query = args .query || {}
    req.session = args.session || {}

    return req
}