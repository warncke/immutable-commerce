'use strict'

/* npm modules */
var _ = require('lodash')
var changeCase = require('change-case')

/* application modules */
var addCommasToSql = require('./add-commas-to-sql')
var getAttributeSql = require('./get-attribute-sql')
var getIndexSql = require('./get-index-sql')
var getPrimaryKey = require('./get-primary-key')

module.exports = getPrimaryTable

/**
 * @function getPrimaryTable
 *
 * @params {object} specification
 *
 * @returns {object}
 */
function getPrimaryTable (specification) {
    // get a local copy of specification
    specification = _.cloneDeep(specification)
    // get attributes
    var attributes = specification.attributes = specification.attributes || {}
    // specification for primary model table
    var primaryTable = {
        columns: [],
        engine: specification.engine || 'InnoDB',
        fileName: '01-' + changeCase.paramCase(specification.name) + '.sql',
        indexes: [],
        path: specification.path || 'sql/immutable',
        name: changeCase.snakeCase(specification.name),
    }
    // get primary key for specification
    var primaryKey = getPrimaryKey(specification)
    // get sql for primary key
    getAttributeSql(primaryKey)
    // add primary key as first column
    primaryTable.columns.push(primaryKey)
    // all model tables have a session attribute
    attributes.sessionId = {type: 'id'}
    // all model tables have a create time
    attributes[ changeCase.camelCase(specification.name) + 'CreateTime' ] = {type: 'datetime'}
    // set name attribute on each attribute
    _(attributes).forEach(function (attribute, name) {
        attribute.name = name
    })
    // add attributes to table in name order
    _( _.sortBy(_.values(attributes), 'name') ).forEach(function (attribute) {
        // get sql
        getAttributeSql(attribute)
        // add to table
        primaryTable.columns.push(attribute)
    })
    // add index on primary key
    primaryTable.indexes.push('PRIMARY KEY (`'+primaryKey.name+'`)')
    // add any unique indexes
    _(specification.uniqueIndex).forEach(function (columns) {
        primaryTable.indexes.push(getIndexSql(columns, true))
    })
    // get any non-unique indexes
    _(specification.index).forEach(function (columns) {
        primaryTable.indexes.push(getIndexSql(columns, false))
    })
    // add commas to sql column and index strings
    addCommasToSql(primaryTable)

    return primaryTable
}