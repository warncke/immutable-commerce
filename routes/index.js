'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* routes */

router.get('/', function(req, res, next) {
    res.json(req.session.data)
    res.end()
});

module.exports = router