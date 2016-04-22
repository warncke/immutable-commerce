'use strict'

/* public function */
module.exports = spreedlyDisplayCardType

/**
 * @function spreedlyDisplayCardType
 *
 * @param {string} cardType - spreedly card type name
 *
 * @returns {string}
 */
function spreedlyDisplayCardType (cardType) {
    if (cardType === 'visa') {
        return 'Visa'
    }
    if (cardType === 'master') {
        return 'Master Card'
    }
    if (cardType === 'american_express') {
        return 'American Express'
    }
    if (cardType === 'discover') {
        return 'Discover'
    }
    if (cardType === 'diners_club') {
        return 'Diners Club'
    }
    if (cardType === 'jcb') {
        return 'JCB'
    }

    return cardType
}