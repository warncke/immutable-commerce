'use strict'

module.exports = {
    // name for controller/model/tables
    name: 'resource',
    // model attibutes
    attributes: {
        'ownerId': {
            type: 'id',
        },
        'resourceName': {
            type: 'string',
        },
    },
    // indexes
    index: [
        ['ownerId', 'resourceName']
    ],
    // model type
    type: 'static',
    // optional related models that extend behavior
    relatedModels: {
        delete: true,
        publish: true,
        undelete: true,
        unpublish: true,
    }
}