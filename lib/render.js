'use strict'

/* public functions */
module.exports = render

function render (req, res, name, data) {
    // send json if requested
    if(req.query.json) {
        res.send(data)
    }
    // otherwise render view
    else {
        res.render(name, data)
    }
}