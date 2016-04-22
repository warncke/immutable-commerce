'use strict'

/* npm modules */
var _ = require('lodash')
var changeCase = require('change-case')

module.exports = getPrimaryKey

/**
 * @function getPrimaryKey
 *
 * @params {object} specification
 *
 * @returns {object}
 */
function getPrimaryKey (specification) {
    var primaryKey
    // check if specification contains any attributes that
    // are explicitly marked as primary key
    _(specification.attributes).forEach(function (attribute, name) {
        if (attribute.primary) {
            // use this as primary key
            primaryKey = attribute
            primaryKey.name = name
            // delete attribute from original so it is not created twice
            delete specification.attributes[name]
        }
    })
    // if primary key was explicitly defined then return
    if (primaryKey) {
        return primaryKey
    }
    // if primary key was not explicitly defined then create
    return {
        generate: true,
        name: changeCase.camelCase(specification.name) + 'Id',
        primary: true,
        type: 'id',
    }
}