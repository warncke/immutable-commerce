'use strict'

/* npm modules */
var _ = require('lodash')
var changeCase = require('change-case')

/* application modules */
var addCommasToSql = require('./add-commas-to-sql')
var createColumnSql = require('./create-column-sql')
var getPrimaryKey = require('./get-primary-key')

module.exports = getUndeleteTable

/**
 * @function getUndeleteTable
 *
 * @params {object} specification
 *
 * @returns {object}
 */
function getUndeleteTable (specification) {
    // do not create unless flag is set
    if (!(specification.relatedModels && specification.relatedModels.undelete)) {
        return
    }
    // get a local copy of specification
    specification = _.cloneDeep(specification)
    // get attributes
    var attributes = {}
    // table name is base + Undelete
    var tableName = changeCase.camelCase(specification.name) + 'Undelete'
    // specification for primary model table
    var table = {
        columns: [],
        engine: specification.engine || 'InnoDB',
        fileName: '01-' + changeCase.paramCase(specification.name) + '-undelete.sql',
        indexes: [],
        path: specification.path || 'sql/immutable',
        name: tableName,
    }
    // primary key is id of delete record to be undeleted
    table.columns.push({
        name: changeCase.camelCase(specification.name) + 'Delete'+'Id',
        primary: true,
        type: 'id',
    })
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
    table.indexes.push('PRIMARY KEY (`'+table.columns[0].name+'`)')
    // add commas to sql column and index strings
    addCommasToSql(table)

    return table
}