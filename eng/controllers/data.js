'use strict'

/* application libraries */
var dataModel = require('../models/data')
var notFound = require('../../lib/not-found')

/* public functions */
var dataController = module.exports = {
    getData: getData,
}

/**
 * @function getData
 *
 * @param {object} req - express request
 * 
 * @returns {Promise}
 */
function getData (req) {
    // get data
    return dataModel.getDataById({
        dataId: req.params.dataId,
    }).then(function (res) {
        // return 404 if not found
        if (!res) {
            return notFound()
        }
        // pretty print JSON
        try {
            res.dataHtml = JSON.stringify(JSON.parse(res.data), undefined, 2)
        }
        catch (err) {
            res.dataHtml = res.data
        }

        return res
    })
}