'use strict'

/* npm libraries */
var _ = require('lodash')
var commandLineArgs = require('command-line-args')
var jsonfile = require('jsonfile')
var path = require('path')

/* application libraries */

/* CLI setup */
var cli = commandLineArgs([
    {
        alias: 'g',
        description: 'Name of code generator to run (required)',
        name: 'generator',
        type: String,
    },
    {
        alias: 'h',
        defaultValue: false,
        description: 'Show usage guide',
        name: 'help',
        type: Boolean,
    },
    {
        alias: 'o',
        defaultValue: path.resolve(__dirname, '..'),
        description: 'Base directory to write output to ('+path.resolve(__dirname, '..')+')',
        name: 'output',
        type: String,
    },
    {
        alias: 's',
        description: 'Name of code specification to build (required)',
        name: 'specification',
        type: String,
    },
])

var options = cli.parse()

/* show help and exit */
if (options.help || !(options.generator && options.specification)) {
    console.log(cli.getUsage())
    process.exit()
}

// load generator
var generator = require('./generator/'+options.generator)
var specification = require('./specification/'+options.specification)

// execute code generator
generator(specification, options)