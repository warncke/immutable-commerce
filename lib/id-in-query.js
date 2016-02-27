'use strict'

/* application libraries */
var validId = require('./valid-id')

/* public functions */
module.exports = idInQuery

/**
 * @function idInQuery
 *
 * @param {array} ids - hex ids to build sql IN query from
 *
 * @returns {string}
 */
function idInQuery (ids) {
    // get valid ids
    ids = validId(ids)
    // require result
    if (!ids.length) {
        return
    }
    // join ids with quotes and unhex functions
    return 'IN( UNHEX(\'' + ids.join('\'), UNHEX(\'') + '\') )'
}