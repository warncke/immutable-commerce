'use strict'

/* application libraries */
var db = require('../lib/database')
var idInQuery = require('../lib/id-in-query')
var immutable = require('../lib/immutable')
var jsonParseMulti = require('../lib/json-parse-multi')
var setId = require('../lib/set-id.js')
var stringifyObject = require('../lib/stringify-object')

/* public functions */
var productModel = module.exports = immutable.model('Product', {
    createProduct: createProduct,
    deleteProduct: deleteProduct,
    publishProduct: publishProduct,
    getProducts: getProducts,
    getProductById: getProductById,
    getProductsById: getProductsById,
})

/**
 * @function createProduct
 *
 * @param {string} originalProductId - hex id of original product
 * @param {string} parentProductId - hex id of original product
 * @param {object} productData - product data
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function createProduct (args) {
    // build product data
    var product = {
        originalProductId: args.originalProductId,
        parentProductId: args.parentProductId,
        productCreateTime: args.session.requestTimestamp,
        productData: stringifyObject(args.productData),
        sessionId: args.session.sessionId,
    }
    // create product id
    setId(product, 'productId', 'originalProductId')
    // insert product
    return db('immutable').query(
        'INSERT INTO `product` VALUES(UNHEX(:productId), UNHEX(:originalProductId), UNHEX(:parentProductId), UNHEX(:sessionId), :productData, :productCreateTime)',
        product,
        undefined,
        args.session
    ).then(function () {
        // return product data on successful insert
        return product
    })
}

/**
 * @function deleteProduct
 *
 * @param {string} productId - hex id of product
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function deleteProduct (args) {
    // insert product delete
    return db('immutable').query(
        'INSERT INTO `productDelete` VALUES(UNHEX(:productId), UNHEX(:sessionId), :productDeleteCreateTime)',
        {
            productId: args.productId,
            sessionId: args.session.sessionId,
            productDeleteCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.affectedRows === '1' ? true : false
    })
}


/**
 * @function publishProduct
 *
 * @param {string} productId - hex id of product
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function publishProduct (args) {
    // insert product publish
    return db('immutable').query(
        'INSERT INTO `productPublish` VALUES(UNHEX(:productId), UNHEX(:sessionId), :productPublishCreateTime)',
        {
            productId: args.productId,
            sessionId: args.session.sessionId,
            productPublishCreateTime: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        return res.info.affectedRows === '1' ? true : false
    })
}

/**
 * @function getProducts
 *
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getProducts (args) {
    return db('immutable').query(
        'SELECT HEX(p.productId) AS productId, HEX(p.originalProductId) AS originalProductId, HEX(p.parentProductId) AS parentProductId, p.productData, p.productCreateTime FROM product p JOIN productPublish pp ON p.productId = pp.productId LEFT JOIN productDelete pd ON p.productId = pd.productId WHERE p.productCreateTime <= :requestTimestamp AND pp.productPublishCreateTime <= :requestTimestamp AND ( pd.productDeleteCreateTime IS NULL OR pd.productDeleteCreateTime > :requestTimestamp )',
        {
            requestTimestamp: args.session.requestTimestamp,
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse product data
        jsonParseMulti(res, 'productData')
        // return modified response
        return res
    })
}

/**
 * @function getProductById
 *
 * @param {string} productId - hex id of product to get
 * @param {object} session - request session
 * 
 * @returns {Promise}
 */
function getProductById (args) {
    return db('immutable').query(
        'SELECT HEX(p.productId) AS productId, HEX(p.originalProductId) AS originalProductId, HEX(p.parentProductId) AS parentProductId, p.productData, p.productCreateTime FROM product p JOIN productPublish pp ON p.productId = pp.productId LEFT JOIN productDelete pd ON p.productId = pd.productId WHERE p.productId = UNHEX(:productId) AND p.productCreateTime <= :requestTimestamp AND pp.productPublishCreateTime <= :requestTimestamp AND ( pd.productDeleteCreateTime IS NULL OR pd.productDeleteCreateTime > :requestTimestamp )',
        {
            productId: args.productId,
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse product data
        jsonParseMulti(res, 'productData')
        // return product or undefined
        return res.length ? res[0] : undefined
    })
}

/**
 * @function getProductsById
 *
 * @param {string} productId - hex id of product to get
 * @param {object} session - request session
 *
 * @returns {Promise}
 */
function getProductsById (args) {
    // build in query for product ids - this validates inputs so output is safe
    var productIdInQuery = idInQuery(args.productIds)
    // no valid input
    if (!productIdInQuery) {
        return
    }
    return db('immutable').unpreparedQuery(
        'SELECT HEX(p.productId) AS productId, HEX(p.originalProductId) AS originalProductId, HEX(p.parentProductId) AS parentProductId, p.productData, p.productCreateTime FROM product p JOIN productPublish pp ON p.productId = pp.productId LEFT JOIN productDelete pd ON p.productId = pd.productId WHERE p.productCreateTime <= :requestTimestamp AND pp.productPublishCreateTime <= :requestTimestamp AND ( pd.productDeleteCreateTime IS NULL OR pd.productDeleteCreateTime > :requestTimestamp ) AND p.productId '+productIdInQuery,
        {
            requestTimestamp: args.session.requestTimestamp
        },
        undefined,
        args.session
    ).then(function (res) {
        // parse product data
        jsonParseMulti(res, 'productData')
        // return products
        return res
    })
}