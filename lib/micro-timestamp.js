'use strict'

var microtime = require('microtime')
var moment = require('moment')

/* public functions */
module.exports = microTimestamp

function microTimestamp () {
    // get time in seconds and microseconds
    var time = microtime.nowStruct()
    // create mysql format timestamp from seconds and append micro seconds
    return moment.unix(time[0]).format('YYYY-MM-DD HH:mm:ss') + '.' + time[1]
}