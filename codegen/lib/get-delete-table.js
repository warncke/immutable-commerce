'use strict'

/* npm modules */
var _ = require('lodash')
var changeCase = require('change-case')

/* application modules */
var addCommasToSql = require('./add-commas-to-sql')
var createColumnSql = require('./create-column-sql')
var getPrimaryKey = require('./get-primary-key')

module.exports = getDeleteTable

/**
 * @function getDeleteTable
 *
 * @params {object} specification
 *
 * @returns {object}
 */
function getDeleteTable (specification) {
    // do not create unless flag is set
    if (!(specification.relatedModels && specification.relatedModels.delete)) {
        return
    }
    // get a local copy of specification
    specification = _.cloneDeep(specification)
    // get attributes
    var attributes = {}
    // table name is base + Delete
    var tableName = changeCase.camelCase(specification.name) + 'Delete'
    // specification for primary model table
    var table = {
        columns: [],
        engine: specification.engine || 'InnoDB',
        fileName: '01-' + changeCase.paramCase(specification.name) + '-delete.sql',
        indexes: [],
        path: specification.path || 'sql/immutable',
        name: tableName,
    }
    // create primary key for delete record
    table.columns.push({
        name: tableName+'Id',
        primary: true,
        type: 'id',
    })
    // link by primary key to primary model table
    var primaryKey = getPrimaryKey(specification)
    primaryKey.primary = false
    table.columns.push(primaryKey)
    // add session
    table.columns.push({
        name: 'sessionId',
        type: 'id',
    })
    // add create table
    table.columns.push({
        name: tableName+'CreateTime',
        type: 'datetime',
    })
    // create sql for columns
    createColumnSql(table)
    // add index on primary key
    table.indexes.push('PRIMARY KEY (`'+tableName+'Id'+'`)')
    // add index on primary model id
    table.indexes.push('KEY (`'+primaryKey.name+'`)')
    // add commas to sql column and index strings
    addCommasToSql(table)

    return table
}