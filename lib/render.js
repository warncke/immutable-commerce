'use strict'

/* npm libraries */
var isObject = require('isobject')

/* application libraries */
var packageJson = require('./package-json')

/* public functions */
module.exports = render

function render (req, res, name, data) {
    // if data is object - which it should be - add
    // application version
    if (isObject(data)) {
        data.appVersion = packageJson.version
    }
    // send json if requested
    if(req.query.json) {
        res.send(data)
    }
    // otherwise render view
    else {
        res.render(name, data)
    }
}