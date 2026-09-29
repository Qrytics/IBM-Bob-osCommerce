'use strict';

/**
 * shipping/table.js: legacy-baseline/catalog/includes/modules/shipping/table.php lines 48 and 111
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-21, BR-22 (plus Q-05)
 */

const { phpToNumber } = require('../phpNumber');
const { getTaxRate } = require('../tax');
const C = require('../constants');

/**
 * table::quote(): table.php lines 48-83.
 *
 * Looks up config.table ("limit:cost,limit:cost,...") with the shipment weight
 * (mode 'weight', then × numBoxes) or with the CART total (mode 'price',
 * getShippableTotal() = $cart->show_total()).
 *
 * For 'weight' mode (table.php lines 53-54):
 *   $order_total = $shipping_weight  (per-box weight)
 *   after lookup: $shipping *= $shipping_num_boxes  (multiply by boxes)
 *
 * For 'price' mode (table.php line 52):
 *   $order_total = getShippableTotal() = $cart->show_total() = cartTotal
 *   (Q-05: this is the CART total using the store's tax rate, not the order subtotal)
 *
 * Cost lookup: parse "limit:rate,limit:rate,..." pairs; find first where order_total <= limit.
 * Then add handling.
 *
 * Returns { id: 'table', module: C.MODULE_SHIPPING_TABLE_TEXT_TITLE,
 *           methods: [{ id: 'table', title: C.MODULE_SHIPPING_TABLE_TEXT_WAY, cost }] }
 * plus `tax` when config.taxClassId > 0.
 *
 * BR-21: table rate looks up by weight or price and adds handling.
 * BR-22: shipping tax is added to the quote when taxClassId > 0.
 * Q-05: 'price' mode uses cart total (store tax), not order subtotal (delivery tax).
 *
 * @param {import('../types').QuoteContext} ctx
 * @returns {import('../types').Quote}
 */
function quote(ctx) {
  const { config, order, catalog, cartTotal, shipment } = ctx;

  let orderTotal;
  if (config.mode === 'price') {
    // table.php line 52: getShippableTotal() = cart->show_total() (Q-05)
    orderTotal = cartTotal;
  } else {
    // table.php line 54: $order_total = $shipping_weight (per-box)
    orderTotal = shipment.shippingWeight;
  }

  // table.php lines 57-64: parse table and find the first band where order_total <= limit
  const tableParts = config.table.split(/[:,]/);
  let shippingRate = 0;
  for (let i = 0; i < tableParts.length; i += 2) {
    if (orderTotal <= phpToNumber(tableParts[i])) {
      shippingRate = phpToNumber(tableParts[i + 1]);
      break;
    }
  }

  // table.php lines 66-68: weight mode multiplies by number of boxes
  if (config.mode === 'weight') {
    shippingRate = shippingRate * shipment.numBoxes;
  }

  // table.php line 74: cost = shipping + handling
  const cost = shippingRate + phpToNumber(config.handling);

  const result = {
    id: 'table',
    module: C.MODULE_SHIPPING_TABLE_TEXT_TITLE,
    methods: [
      {
        id: 'table',
        title: C.MODULE_SHIPPING_TABLE_TEXT_WAY,
        cost,
      },
    ],
  };

  // table.php lines 76-78: add tax when tax class is set
  if (config.taxClassId > 0) {
    result.tax = getTaxRate(
      catalog,
      config.taxClassId,
      order.delivery.countryId,
      order.delivery.zoneId
    );
  }

  return result;
}

module.exports = { quote };
