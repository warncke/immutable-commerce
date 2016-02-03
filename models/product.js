'use strict'

/* application libraries */
var db = require('../lib/database')
var stableId = require('../lib/stable-id')
var stringify = require('json-stable-stringify')

function createProduct (originalProductId, productData, requestTimestamp) {
    // build product data
    var product = {
        originalProductId: originalProductId,
    }
    // set product data as JSON encoded string
    try {
        product.productData = stringify(productData)
    }
    catch (ex) {
        product.prodcutData = '{}'
    }
    // create product data id from product data alone - there may be
    // multiple instances of the same product data over time if a
    // product is deleted and readded so the productId itself has
    // to be based on both productData and productCreateTime but there
    // also needs to be a way to find products only by their data
    product.productDataId = stableId(product)
    product.productCreateTime = requestTimestamp
    // create product id based on data, original product id, and create time
    product.productId = stableId(product)
    // insert product
    return db('immutable').query(
        'INSERT INTO `product` VALUES(UNHEX(:productId), UNHEX(:productDataId), UNHEX(:originalProductId), :productData, :productCreateTime)',
        product
    ).then(function (res) {
        // return product data on successful insert
        return product
    })
}

function getProducts (requestTimestamp) {
    return db('immutable').query(
        'SELECT HEX(p.productId) AS productId, HEX(p.productDataId) AS productDataId, HEX(p.originalProductId) AS originalProductId, p.productData, p.productCreateTime FROM product p LEFT JOIN productDelete pd ON p.productId = pd.productId WHERE p.productCreateTime <= :requestTimestamp AND ( pd.productDeleteTime IS NULL OR pd.productDeleteTime > :requestTimestamp )',
        {requestTimestamp: requestTimestamp}
    ).then(function (res) {
        for (var i=0; i < res.length; i++) {
            // convert product data to JSON
            res[i].productData = JSON.parse(res[i].productData)
        }
        return res
    })
}

function getProductId (productId, requestTimestamp) {
    return db('immutable').query(
        'SELECT HEX(p.productId) AS productId FROM product p LEFT JOIN productDelete pd ON p.productId = pd.productId WHERE p.productId = UNHEX(:productId) AND p.productCreateTime <= :requestTimestamp AND ( pd.productDeleteTime IS NULL OR pd.productDeleteTime > :requestTimestamp )',
        {productId: productId, requestTimestamp: requestTimestamp}
    ).then(function (res) {
        return res.info.numRows == 1 ? res[0].productId : false
    })
}

module.exports = {
    createProduct: createProduct,
    getProductId: getProductId,
    getProducts: getProducts,
}