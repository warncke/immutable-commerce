'use strict'

function isDuplicate (err) {
    return err.message.match(/^Duplicate/) ? true : false
}

module.exports = isDuplicate