'use strict';

/**
 * shipping/index.js: box weights from classes/shipping.php and the shipping
 * selection logic of checkout_shipping.php.
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-18, BR-23
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('../phpNumber');
// eslint-disable-next-line no-unused-vars
const { FREE_SHIPPING_TITLE } = require('../constants');
const { NotImplemented } = require('../errors');

/**
 * shipping::quote() preamble: classes/shipping.php lines 50-62.
 * Adds the box tare weight or the percentage padding (whichever the legacy
 * comparison picks), then splits into boxes when over the max weight.
 *
 * @param {number} totalWeight  $cart->show_weight()
 * @param {{weight:string, padding:string, maxWeight:string}} box  SHIPPING_BOX_WEIGHT / _PADDING / SHIPPING_MAX_WEIGHT
 * @returns {import('../types').Shipment}
 */
function prepareShipment(totalWeight, box) {
  throw new NotImplemented('T8', 'prepareShipment');
}

/**
 * Free-shipping pre-check: checkout_shipping.php lines 73-100.
 * Compares the order total BEFORE shipping (it includes tax when prices are
 * shown without tax, see Q-07) with the threshold, for the allowed destination.
 *
 * @param {import('../types').Order} order  the order built without shipping
 * @param {import('../types').FreeShippingSettings} freeShipping
 * @param {number} storeCountryId  STORE_COUNTRY
 * @returns {boolean}
 */
function isFreeShippingOffered(order, freeShipping, storeCountryId) {
  throw new NotImplemented('T8', 'isFreeShippingOffered');
}

/**
 * Building the session $shipping array: checkout_shipping.php lines 115-129.
 * With free shipping: { id: 'free_free', title: FREE_SHIPPING_TITLE, cost: '0' }.
 * Otherwise: { id: quote.id + '_' + method.id, title: quote.module + ' (' + method.title + ')', cost: method.cost },
 * using the first method.
 *
 * @param {import('../types').Quote} quote
 * @param {boolean} freeShippingOffered
 * @returns {import('../types').ShippingSelection}
 */
function selectShipping(quote, freeShippingOffered) {
  throw new NotImplemented('T8', 'selectShipping');
}

module.exports = { prepareShipment, isFreeShippingOffered, selectShipping };
