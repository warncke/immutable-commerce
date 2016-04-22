'use strict'

module.exports = addCommasToSql

/**
 * @function addCommasToSql
 *
 * @params {object} tabke
 */
function addCommasToSql (table) {
    /* add commas to sql for columns and indexes */
    if (table.indexes.length) {
        // add commas to all columns
        table.columns.forEach(function (column) {
            column.sql = column.sql + ','
        })
        // add commas to all indexes except last
        table.indexes.forEach(function (column, idx) {
            // do not add to last
            if (idx+1 === table.indexes.length) {
                return
            }
            // add comma to sql
            table.indexes[idx] = table.indexes[idx] + ','
        })
    }
    else {
        // add commas to all columns except last
        table.columns.forEach(function (column, idx) {
            // do not add to last
            if (idx+1 === table.columns.length) {
                return
            }
            column.sql = column.sql + ','
        })
    }

    // add commas to insert sql - all but last column
    table.columns.forEach(function (column, idx) {
        // do not add to last
        if (idx+1 === table.columns.length) {
            return
        }
        column.insertSql = column.insertSql + ','
    })
}