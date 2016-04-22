'use strict'

/* npm modules */
var _ = require('lodash')
var changeCase = require('change-case')
var fs = require('fs')
var Mustache = require('mustache-file')
var path = require('path')
var Promise = require('bluebird')
var ucfirst = require('ucfirst')

var mustache = new Mustache({
    path: [
        path.resolve(__dirname, '../template'),
        path.resolve(__dirname, '../template/immutable'),
    ],
})

/* application modules */
var db = require('../../lib/database')
var getDeleteTable = require('../lib/get-delete-table')
var getPrimaryTable = require('../lib/get-primary-table')
var getPublishTable = require('../lib/get-publish-table')
var getUndeleteTable = require('../lib/get-undelete-table')
var getUnpublishTable = require('../lib/get-unpublish-table')

/* public functions */
module.exports = generator

/**
 * @function generator
 *
 * @param {object} specifcation
 */
function generator (specification, options) {
    // generate one or more controllers
    var controllers = controllerGenerator(specification, options)
    // generate one or more models
    var models = modelGenerator(specification, options)
    // generate one or more (sql) tables
    var tables = tableGenerator(specification, options)

    // wait for all specifications to be built
    Promise.all([
        controllers,
        models,
        tables
    ])
    .then(function (res) {
        // each result should be list of specifications
        var controllers = res[0]
        var models = res[1]
        var tables = res[2]
        // write out files
        Array.prototype.concat.call(controllers, models, tables).forEach(function (file) {
            // skip undefined
            if (!file) {
                return
            }
            // write file
            fs.writeFileSync(path.resolve(options.output, file.path, file.name), file.data)
        })
    })
    .catch(function (err) {
        console.log(err)
    })
    .finally(function () {
        process.exit()
    })
}

/* private functions */

/**
 * @function controllerGenerator
 *
 * @param {object} specifcation
 */
function controllerGenerator (specification, options) {
    // get a local copy of specification
    specification = _.cloneDeep(specification)
    // controller data
    var controller = {}

    // set value for controller
    controller.controllerName = changeCase.pascalCase(specification.name) + 'Controller'
    controller.modelName = changeCase.pascalCase(specification.name) + 'Model'

    // create npm libraries array if it does not exist
    controller.npmLibraries = specification.npmLibraries || {}
    // create application libraries array if it does not exists
    controller.applicationLibraries = specification.applicationLibraries || {}

    // always use immutable
    controller.applicationLibraries['immutable'] = '../lib/immutable'

    // convert library hashes to arrays
    controller.applicationLibraries = _.map(controller.applicationLibraries, function (val, key) {
        return {
            library: val,
            variable: key,
        }
    })
    controller.npmLibraries = _.map(controller.npmLibraries, function (val, key) {
        return {
            library: val,
            variable: key,
        }
    })

    // return promise that will be resolved with controller
    return mustache.render('controller', controller)
    // success
    .then(function (res) {
        // build data and name for controller file
        var controller = {
            data: res,
            path: 'controllers',
            name: changeCase.paramCase(specification.name) + '.js',
        }
        // resolve with controller
        return controller
    })
}

/**
 * @function modelGenerator
 *
 * @param {object} specifcation
 */
function modelGenerator (specification, options) {
    // get a local copy of specification
    specification = _.cloneDeep(specification)
    // model data
    var model = {
        related: [],
    }
    // set name
    model.name = changeCase.camelCase(specification.name)
    model.ucName = ucfirst(model.name)
    model.modelName = changeCase.pascalCase(specification.name) + 'Model'

    // create npm libraries array if it does not exist
    model.npmLibraries = specification.npmLibraries || {}
    // create application libraries array if it does not exists
    model.applicationLibraries = specification.applicationLibraries || {}

    // always use immutable
    model.applicationLibraries['immutable'] = '../lib/immutable'

    // get primary table which will be used to construct model
    var primaryTable = getPrimaryTable(specification)
    // create function data
    var create = model.create = {
        // data parameters that must be encoded/decoded
        dataParams: [],
    }
    // use columns from table for insert
    create.columns = primaryTable.columns
    // params for create function will be columns without calculated and default values
    var createParams = create.params = []
    // set name
    create.name = 'create'+ucfirst(model.name)

    // add table columns to model
    primaryTable.columns.forEach(function (column, idx) {
        // get copy of column spec
        var param = _.cloneDeep(column)
        // break out id param
        if (column.type === 'id' && column.generate) {
            // set as id column
            model.primaryIdParam = param
            return
        }
        // break out create time param
        else if (column.name === model.name + 'CreateTime') {
            model.primaryCreateTimeParam = param
            return
        }
        // do not add sessionId and createTime
        else if (column.name === 'sessionId') {
            return
        }
        // set javascript type and value string
        if (column.type === 'bool') {
            param.jsType = 'boolean'
            param.value = 'args.'+param.name
        }
        else if (column.type === 'data') {
            param.jsType = 'object'
            param.value = 'stringifyObject(args.'+param.name+')'
            // add to list of data params
            create.dataParams.push(param.name)
            // load libraries for handling json data
            model.applicationLibraries['jsonParseMulti'] = '../lib/json-parse-multi'
            model.applicationLibraries['stringifyObject'] = '../lib/stringify-object'
        }
        else {
            param.jsType = 'string'
            param.value = 'args.'+param.name
        }
        // add column to params
        createParams.push(param)
    })

    // load database library
    model.applicationLibraries['db'] = '../lib/database'
    // load library for setting unique ids
    model.applicationLibraries['setId'] = '../lib/set-id'

    // if there is one data param set as string
    if (create.dataParams.length === 1) {
        create.dataParamsStatement = "'"+create.dataParams[0]+"'"
    }
    // if there are multiple data params set as array
    else if (create.dataParams.length > 1) {
        create.dataParamsStatement = "["+create.dataParams.join(', ')+"]"
    }

    // add any related models to model
    _.forEach(specification.relatedModels, function (val, key) {
        // add to list of functions to create
        model.related.push({
            name: key,
            ucName: ucfirst(key),
            tableName: changeCase.camelCase(specification.name) + ucfirst(key),
            ucModelName: ucfirst(specification.name),
            idColumnName: model.primaryIdParam.name,
            specificationName: specification.name,
        })
    })

    console.log(model)

    // convert library hashes to arrays
    model.applicationLibraries = _.map(model.applicationLibraries, function (val, key) {
        return {
            library: val,
            variable: key,
        }
    })
    model.npmLibraries = _.map(model.npmLibraries, function (val, key) {
        return {
            library: val,
            variable: key,
        }
    })

    // return promise that will be resolved with controller
    return mustache.render('model', model)
    // success
    .then(function (res) {
        // build data and name for file
        var file = {
            data: res,
            path: 'models',
            name: changeCase.paramCase(specification.name) + '.js',
        }
        // resolve with file
        return file
    })
}

/**
 * @function renderTable
 *
 * @param {object} table
 */
function renderTable (table) {
    return mustache.render('table', table)
    // success
    .then(function (createTableSql) {
        table.sql = createTableSql
        // create table and get validated/formatted sql
        return validateTableSql(table)
    })
    // success
    .then(function (createTableSql) {
        // build data and name for controller file
        var file = {
            data: table.sql,
            path: table.path,
            name: table.fileName,
        }
        // resolve with file data
        return file
    })
}

/**
 * @function tableGenerator
 *
 * @param {object} specifcation
 */
function tableGenerator (specification, options) {
    // promises to be resolved with table file data
    var promises = []
    // build primary table
    promises.push(renderTable(getPrimaryTable(specification)))
    // build publish table
    if (specification.relatedModels.publish) {
        promises.push(renderTable(getPublishTable(specification)))
    }
    // build unpublish table
    if (specification.relatedModels.unpublish) {
        promises.push(renderTable(getUnpublishTable(specification)))
    }
    // build delete table
    if (specification.relatedModels.delete) {
        promises.push(renderTable(getDeleteTable(specification)))
    }
    // build undelete table
    if (specification.relatedModels.undelete) {
        promises.push(renderTable(getUndeleteTable(specification)))
    }
    // return promise that will be resolved with all table sql promises
    return Promise.all(promises)
}

/**
 * @function validateCreateTableSql
 *
 * @param {object} table
 *
 * @returns {Promise}
 */
function validateTableSql (table) {
    // drop table if it exists
    return db('codegen').query('DROP TABLE IF EXISTS`'+table.name+'`')
    // attempt to create table
    .then(function () {
        return db('codegen').query(table.sql)
    })
    // get table sql from database
    .then(function () {
        return db('codegen').query('SHOW CREATE TABLE `'+table.name+'`')
        // set sql
        .then(function (res) {
            // set sql from response
            if (res.length) {

                table.sql = res[0]['Create Table'] + ";\n"
            }
        })
    })
    // drop table again
    .then(function () {
        return db('codegen').query('DROP TABLE `'+table.name+'`')
    })
}