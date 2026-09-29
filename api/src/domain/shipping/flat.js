'use strict';

/**
 * shipping/flat.js: legacy-baseline/catalog/includes/modules/shipping/flat.php line 48
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-19, BR-22
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('../phpNumber');
// eslint-disable-next-line no-unused-vars
const { getTaxRate } = require('../tax');
// eslint-disable-next-line no-unused-vars
const C = require('../constants');
const { NotImplemented } = require('../errors');

/**
 * flat::quote()
 *
 * cost = MODULE_SHIPPING_FLAT_COST (config.cost).
 * Returns { id: 'flat', module: C.MODULE_SHIPPING_FLAT_TEXT_TITLE,
 *           methods: [{ id: 'flat', title: C.MODULE_SHIPPING_FLAT_TEXT_WAY, cost }] }
 * plus `tax` (tep_get_tax_rate for the delivery location) only when config.taxClassId > 0.
 *
 * @param {import('../types').QuoteContext} ctx
 * @returns {import('../types').Quote}
 */
function quote(ctx) {
  throw new NotImplemented('T8', 'flat.quote');
}

module.exports = { quote };
