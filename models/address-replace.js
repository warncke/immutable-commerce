'use strict'

/* npm libraries */

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')

/* public functions */
module.exports = immutable.model('AddressReplace', {
    createAddressReplace: createAddressReplace,
})

/**
 * @function createAddressReplace
 *
 * @param {string} accountId - optional hex id of account to get addresses for
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAddressReplace (args) {
    // insert address replace record
    return db('immutable').query(
        'INSERT INTO addressReplace VALUES(UNHEX(:oldAddressId), UNHEX(:newAddressId), UNHEX(:accountId), UNHEX(:sessionId), :addressReplaceCreateTime)',
        {
            accountId: args.session.accountId,
            addressReplaceCreateTime: args.session.requestTimestamp,
            oldAddressId: args.oldAddressId,
            newAddressId: args.newAddressId,
            sessionId: args.session.sessionId,
        },
        undefined,
        args.session
    )
}