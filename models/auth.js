'use strict'

/* application libraries */
var db = require('../lib/database.js')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
module.exports = immutable.model('Auth', {
    createAuth: createAuth,
    getAuthByAccountId: getAuthByAccountId,
    getAuthByProviderNameAndAccountId: getAuthByProviderNameAndAccountId,
})

/**
 * @function createAuth
 *
 * @param {string} authProviderAccountId - user id of account with auth provider
 * @param {object} authProviderData
 * @param {string} authProviderName - name of auth provider
 * @param {string} accountId - hex id of account
 * @param {string} originalAuthId - hex id
 * @param {string} parentAuthId - hex id
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function createAuth (args) {
    // build data
    var auth = {
        authCreateTime: args.session.requestTimestamp,
        authProviderAccountId: args.authProviderAccountId,
        authProviderData: stringifyObject(args.authProviderData),
        authProviderName: args.authProviderName,
        accountId: args.accountId,
        originalAuthId: args.originalAuthId,
        parentAuthId: args.parentAuthId,
    }
    // get id
    setId(auth, 'authId', 'originalAuthId')
    // insert
    return db('immutable').query(
        'INSERT INTO auth VALUES(UNHEX(:authId), UNHEX(:originalAuthId), UNHEX(:parentAuthId), UNHEX(:accountId), :authProviderName, :authProviderAccountId, :authProviderData, :authCreateTime)',
        auth,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        // unpack JSON encoded data
        return jsonParseMulti(auth, ['authProviderData'])
    })
}

/**
* @function getAuthByAccountId
*
* @param {string} accountId - hex id
*
* @returns {Promise}
*/
function getAuthByAccountId (args) {
    // select
    return db('immutable').query(
        'SELECT HEX(a.authId) AS authId, HEX(a.originalAuthId) AS originalAuthId, HEX(a.parentAuthId) AS parentAuthId, HEX(a.accountId) AS accountId, a.authProviderName, a.authProviderAccountId, a.authProviderData, a.authCreateTime FROM auth a LEFT JOIN auth a2 ON a2.parentAuthId = a.authId WHERE a.accountId = UNHEX(:accountId) AND a2.authId IS NULL',
        args,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        // unpack JSON encoded data
        return res.length ? jsonParseMulti(res, ['authProviderData']) : []
    })
}

/**
* @function getAuthByProviderNameAndAccountId
*
* @param {string} authProviderName - name of auth provider
* @param {string} authProviderAccountId - user id of account with auth provider
*
* @returns {Promise}
*/
function getAuthByProviderNameAndAccountId (args) {
    // select
    return db('immutable').query(
        'SELECT HEX(a.authId) AS authId, HEX(a.originalAuthId) AS originalAuthId, HEX(a.parentAuthId) AS parentAuthId, HEX(a.accountId) AS accountId, a.authProviderName, a.authProviderAccountId, a.authProviderData, a.authCreateTime FROM auth a LEFT JOIN auth a2 ON a2.parentAuthId = a.authId WHERE a.authProviderName = :authProviderName AND a.authProviderAccountId = :authProviderAccountId AND a2.authId IS NULL',
        args,
        undefined,
        args.session
    )
    // success
    .then(function (res) {
        // unpack JSON encoded data
        return res.length ? jsonParseMulti(res[0], ['authProviderData']) : undefined
    })
}