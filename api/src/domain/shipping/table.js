'use strict';

/**
 * shipping/table.js: legacy-baseline/catalog/includes/modules/shipping/table.php lines 48 and 111
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-21, BR-22 (plus Q-05)
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('../phpNumber');
// eslint-disable-next-line no-unused-vars
const { getTaxRate } = require('../tax');
// eslint-disable-next-line no-unused-vars
const C = require('../constants');
const { NotImplemented } = require('../errors');

/**
 * table::quote()
 *
 * Looks up config.table ("limit:cost,limit:cost,...") with the shipment weight
 * (mode 'weight', then x numBoxes) or with the CART total (mode 'price',
 * getShippableTotal() = $cart->show_total()), then adds config.handling.
 * Returns { id: 'table', module: C.MODULE_SHIPPING_TABLE_TEXT_TITLE,
 *           methods: [{ id: 'table', title: C.MODULE_SHIPPING_TABLE_TEXT_WAY, cost }] }
 * plus `tax` (tep_get_tax_rate for the delivery location) only when config.taxClassId > 0.
 *
 * @param {import('../types').QuoteContext} ctx
 * @returns {import('../types').Quote}
 */
function quote(ctx) {
  throw new NotImplemented('T8', 'table.quote');
}

module.exports = { quote };
