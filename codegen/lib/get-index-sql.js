'use strict'

/* public functions */
module.exports = getIndexSql

/**
 * @function getAttributeSql
 *
 * @params {array|string} columns
 * @params {boolean} unqiue
 *
 * @returns {string}
 */
function getIndexSql (columns, unique) {
    var columnNames
    // array of columns names
    if (Array.isArray(columns)) {
        columnNames = '`' + columns.join('`,`') + '`'
    }
    // single string column name
    else {
        columnNames = '`'+columns+'`'
    }

    var keyType = unique ? 'UNIQUE KEY' : 'KEY'

    return keyType + ' (' + columnNames + ')'
}