'use strict'

function Cart (cart) {
    // get attributes of cart object
    var attributes = Object.keys(cart)
    // copy to class instance - is this faster or slower than __proto__ assignment ?? - probably doesn't matter
    for (var i=0; i < attributes.length; i++) {
        var attribute = attributes[i]
        this[attribute] = cart[attribute]
    }
    // set default values for associations that may be empty
    if (!this.products) {
        this.products = {}
    }
}

Cart.prototype.sumProductQuantity = function sumProductQuantity () {
    console.log(this)
}

module.exports = Cart