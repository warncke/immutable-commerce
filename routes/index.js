'use strict'

/* npm libraries */
var express = require('express')
var router = express.Router()

/* routes */

router.get('/', function(req, res, next) {
    res.send(req.session.data)
});

module.exports = router