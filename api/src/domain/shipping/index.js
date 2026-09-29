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

const { phpToNumber } = require('../phpNumber');
const { FREE_SHIPPING_TITLE } = require('../constants');

/**
 * shipping::quote() preamble: classes/shipping.php lines 50-62.
 *
 * Adds the box tare weight or the percentage padding (whichever the legacy
 * comparison picks), then splits into boxes when over the max weight.
 *
 * Legacy (shipping.php line 54):
 *   if (SHIPPING_BOX_WEIGHT >= $shipping_weight * SHIPPING_BOX_PADDING/100)
 *     $shipping_weight += SHIPPING_BOX_WEIGHT
 *   else
 *     $shipping_weight += $shipping_weight * SHIPPING_BOX_PADDING/100
 *   if ($shipping_weight > SHIPPING_MAX_WEIGHT)
 *     $shipping_num_boxes = ceil($shipping_weight / SHIPPING_MAX_WEIGHT)
 *     $shipping_weight = $shipping_weight / $shipping_num_boxes
 *
 * BR-18: box weight packing — tare vs percentage padding comparison.
 *
 * @param {number} totalWeight  $cart->show_weight()
 * @param {{weight:string, padding:string, maxWeight:string}} box  SHIPPING_BOX_WEIGHT / _PADDING / SHIPPING_MAX_WEIGHT
 * @returns {import('../types').Shipment}
 */
function prepareShipment(totalWeight, box) {
  const boxWeight = phpToNumber(box.weight);
  const boxPadding = phpToNumber(box.padding);
  const maxWeight = phpToNumber(box.maxWeight);

  let shippingWeight = totalWeight;

  // shipping.php line 54: tare vs percentage
  if (boxWeight >= shippingWeight * boxPadding / 100) {
    shippingWeight = shippingWeight + boxWeight;
  } else {
    shippingWeight = shippingWeight + (shippingWeight * boxPadding / 100);
  }

  let numBoxes = 1;
  if (shippingWeight > maxWeight) {
    numBoxes = Math.ceil(shippingWeight / maxWeight);
    shippingWeight = shippingWeight / numBoxes;
  }

  return { shippingWeight, numBoxes };
}

/**
 * Free-shipping pre-check: checkout_shipping.php lines 73-100.
 *
 * Checks the destination type (national = same country as store, international = different,
 * both = always pass), then checks order.info.total >= threshold.
 * Note: order.info.total includes tax when exclusive (Q-07).
 *
 * BR-23: free shipping offered when total >= threshold and destination matches.
 *
 * @param {import('../types').Order} order  the order built without shipping
 * @param {import('../types').FreeShippingSettings} freeShipping
 * @param {number} storeCountryId  STORE_COUNTRY
 * @returns {boolean}
 */
function isFreeShippingOffered(order, freeShipping, storeCountryId) {
  if (!freeShipping.enabled) return false;

  let pass = false;
  const dest = freeShipping.destination;
  const deliveryCountryId = order.delivery.countryId;

  // checkout_shipping.php lines 76-90
  if (dest === 'national') {
    pass = deliveryCountryId === storeCountryId;
  } else if (dest === 'international') {
    pass = deliveryCountryId !== storeCountryId;
  } else if (dest === 'both') {
    pass = true;
  }

  // checkout_shipping.php line 93
  if (pass && phpToNumber(order.info.total) >= phpToNumber(freeShipping.over)) {
    return true;
  }
  return false;
}

/**
 * Building the session $shipping array: checkout_shipping.php lines 115-129.
 *
 * With free shipping: { id: 'free_free', title: FREE_SHIPPING_TITLE, cost: '0' }.
 * Otherwise: { id: quote.id + '_' + method.id, title: quote.module + ' (' + method.title + ')', cost: method.cost },
 * using the first method.
 *
 * BR-23: selectShipping builds the session shipping record.
 *
 * @param {import('../types').Quote} quote
 * @param {boolean} freeShippingOffered
 * @returns {import('../types').ShippingSelection}
 */
function selectShipping(quote, freeShippingOffered) {
  if (freeShippingOffered) {
    // checkout_shipping.php lines 117-119
    return {
      id: 'free_free',
      title: FREE_SHIPPING_TITLE,
      cost: '0',
    };
  }

  // checkout_shipping.php lines 127-129: first method
  const method = quote.methods[0];
  return {
    id: quote.id + '_' + method.id,
    title: quote.module + ' (' + method.title + ')',
    cost: method.cost,
  };
}

module.exports = { prepareShipment, isFreeShippingOffered, selectShipping };
