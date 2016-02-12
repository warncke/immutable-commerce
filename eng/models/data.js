'use strict'

/* npm libraries */

/* application libraries */
var db = require('../lib/database.js')

/* public functions */
var dataModel = module.exports = {
    getDataById: getDataById,
}

/**
 * @function getDataById
 *
 * @param {string} dataId - hex id of data
 * 
 * @returns {Promise}
 */
 function getDataById (args) {
    return db('log').query(
        'SELECT HEX(dataId) AS dataId, data FROM data WHERE dataId = UNHEX(:dataId)',
        args
    ).then(function (res) {
        // return row if found
        return res.length ? res[0] : undefined
    })
 }