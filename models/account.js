'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var setId = require('../lib/set-id.js')

/* public functions */
module.exports = immutable.model('Account', {
    createAccount: createAccount,
    getAccountById: getAccountById
})

/**
 * @function createAccount
 *
 * @param {string} frUid - current frUid
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAccount (args) {
    // build data
    var account = {
        accountCreateTime: args.session.requestTimestamp,
        frUid: args.frUid,
        sessionId: args.session.sessionId,
    }
    // get id
    setId(account, 'accountId')
    // insert
    return db('immutable').query(`
        INSERT INTO account
            (accountId, sessionId, frUid, accountCreateTime)
            VALUES(UNHEX(:accountId), UNHEX(:sessionId), :frUid, :accountCreateTime)`,
        account,
        undefined,
        args.session
    ).then(function (res) {
        // return inserted data
        return account
    })
}

/**
 * @function getAccountById
 *
 * @param {string} accountId - hex id of account
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getAccountById(args) {
    // select account by id
    return db('immutable').query(
        `SELECT
            HEX(t.accountId) AS accountId,
            HEX(t.sessionId) AS sessionId,
            t.frUid,
            t.accountCreateTime
        FROM account t
        WHERE t.accountId = UNHEX(:accountId) AND t.accountCreateTime <= :requestTimestamp`,
        {
            accountId: args.accountId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // return account if found
        return res.length ? res[0] : undefined
    })
}
