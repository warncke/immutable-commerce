'use strict'

/* public functions */
module.exports = getAttributeSql

/* private variables */
var typeSql = {
    'datetime': 'datetime(6)',
    'id': 'binary(16)',
    'string': 'varchar(255)',
    'text': 'mediumtext',
}

/**
 * @function getAttributeSql
 *
 * @params {object} attribute
 */
function getAttributeSql (attribute) {
    // tokens to compose sql of
    var tokens = []
    // require valid type
    if (!typeSql[attribute.type]) {
        throw new Error('invalid type '+attribute.type)
    }
    // add attribute name
    tokens.push('`'+attribute.name+'`')
    // add attribute type
    tokens.push(typeSql[attribute.type])
    // unless null is allowed add not null
    if (!attribute.null) {
        tokens.push('NOT NULL')
    }
    // if there is a default value specified, add it
    if (attribute.default) {
        // use bare number
        if (typeof attribute.default === 'number') {
            tokens.push('DEFAULT '+attribute.default)
        }
        // quote anything else
        else {
            tokens.push("DEFAULT '"+attribute.default+"'")
        }
    }
    // otherwise, if attribute is nullable set default null
    else if (attribute.null) {
        tokens.push('DEFAULT NULL')
    }
    // set attribute sql from tokens joined with space
    attribute.sql = tokens.join(' ')
    // set insert sql
    attribute.insertSql = attribute.type === 'id'
        // unhex id attributes
        ? 'UNHEX(:'+attribute.name+')'
        : ':'+attribute.name
}