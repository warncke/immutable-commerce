'use strict'

/* public functions */
module.exports = argsFromReq

/* @function argsFromRequest
 *
 * @param {object} req - express request object
 *
 * @returns {object} controller arguments
 */
function argsFromReq (req) {
    // copy only the input data from the express request
    return {
        body: req.body,
        cookies: req.cookies,
        params: req.params,
        query: req.query,
        session: req.session,
    }
}