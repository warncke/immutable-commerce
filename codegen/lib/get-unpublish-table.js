'use strict'

/* npm modules */
var _ = require('lodash')
var changeCase = require('change-case')

/* application modules */
var addCommasToSql = require('./add-commas-to-sql')
var createColumnSql = require('./create-column-sql')
var getPrimaryKey = require('./get-primary-key')

module.exports = getUnpublishTable

/**
 * @function getUnpublishTable
 *
 * @params {object} specification
 *
 * @returns {object}
 */
function getUnpublishTable (specification) {
    // do not create unless flag is set
    if (!(specification.relatedModels && specification.relatedModels.unpublish)) {
        return
    }
    // get a local copy of specification
    specification = _.cloneDeep(specification)
    // get attributes
    var attributes = {}
    // table name is base + Unpublish
    var tableName = changeCase.camelCase(specification.name) + 'Unpublish'
    // specification for primary model table
    var table = {
        columns: [],
        engine: specification.engine || 'InnoDB',
        fileName: '01-' + changeCase.paramCase(specification.name) + '-unpublish.sql',
        indexes: [],
        path: specification.path || 'sql/immutable',
        name: tableName,
    }
    // primary key is id of publish record to be unpublishd
    table.columns.push({
        name: changeCase.camelCase(specification.name) + 'Publish'+'Id',
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