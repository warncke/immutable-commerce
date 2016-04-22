'use strict'

/* npm modules */
var _ = require('lodash')

/* application modules */
var getAttributeSql = require('./get-attribute-sql')

module.exports = createColumnSql

/**
 * @function createColumnSql
 *
 * @params {object} table
 */
function createColumnSql (table) {
    _(table.columns).forEach(function (column) {
        getAttributeSql(column)
    })
}