'use strict'

/* npm libraries */
var jsonfile = require('jsonfile')

/* application libraries */
var config = require('../config/package-json')

/* public variables */
module.exports = jsonfile.readFileSync(config.pathToPackageJson)