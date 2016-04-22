(function () {
// app configuration
var config = {
    engEndpoint: 'http://marketplacenc.dev:3001',
    rpcEndpoint: 'http://marketplacenc.dev/shopapi/rpc',
    rpcKey: 'E4BW6D48KWMC4PCW2HZ4CSWWWPBH8UEY',
}

/* public functions */
window.IMEC = {
    config: config,
    getData: getData,
    executeCall: executeCall,
}

/**
 * @function executeCall
 *
 * @param {string} moduleCallId - hex call id
 * @param {string} argsId - hex call id
 */
 function executeCall (method, moduleCallId, argsId) {
    // load argument data
    getData(argsId).then(function (argsData) {
        // make module call
        return reqwest({
            contentType: 'application/json',
            data: JSON.stringify({
                method: method,
                params: argsData,
                rpcKey: config.rpcKey,
            }),
            method: 'POST',
            type: 'json',
            url: config.rpcEndpoint,
        })
        // display response
        .then(function (res) {
            alert( JSON.stringify(res.result, undefined, 2) )
        })
        // alert errors
        .catch(function (err) {
            var errorMessage;
            try {
                var error = JSON.parse(err.responseText)
                errorMessage = error.error
            }
            catch (err) {
                console.log(err)
            }
            if (!errorMessage) {
                errorMessage = err.response
            }
            alert(err.status + ' - ' + errorMessage)
        })
    })
 }

/**
 * @function getData
 *
 * @param {string} dataId - hex data id
 */
function getData (dataId) {
    return reqwest({
        data: {json: 1},
        type: 'json',
        url: config.engEndpoint + '/data/' + dataId,
    })
    .then(function (res) {
        // resolve with data
        return JSON.parse(res.data)
    })
}

})()
