'use strict';

/**
 * shipping/item.js: legacy-baseline/catalog/includes/modules/shipping/item.php lines 48 and 93
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-20, BR-22
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('../phpNumber');
// eslint-disable-next-line no-unused-vars
const { getTaxRate } = require('../tax');
// eslint-disable-next-line no-unused-vars
const C = require('../constants');
const { NotImplemented } = require('../errors');

/**
 * item::quote()
 *
 * cost = config.cost x number of items ($total_count, i.e. cartCount; content type is
 * 'physical') + config.handling.
 * Returns { id: 'item', module: C.MODULE_SHIPPING_ITEM_TEXT_TITLE,
 *           methods: [{ id: 'item', title: C.MODULE_SHIPPING_ITEM_TEXT_WAY, cost }] }
 * plus `tax` (tep_get_tax_rate for the delivery location) only when config.taxClassId > 0.
 *
 * @param {import('../types').QuoteContext} ctx
 * @returns {import('../types').Quote}
 */
function quote(ctx) {
  throw new NotImplemented('T8', 'item.quote');
}

module.exports = { quote };
