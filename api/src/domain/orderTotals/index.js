'use strict';

/**
 * orderTotals/index.js: order_total::process() in
 * legacy-baseline/catalog/includes/classes/order_total.php line 34
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-28
 */

// eslint-disable-next-line no-unused-vars
const { tepNotNull } = require('../general');
// eslint-disable-next-line no-unused-vars
const { ORDER_TOTAL_MODULES } = require('../constants');
const { NotImplemented } = require('../errors');

// eslint-disable-next-line no-unused-vars
const MODULES = {
  ot_subtotal: require('./subtotal'),
  ot_shipping: require('./shipping'),
  ot_tax: require('./tax'),
  ot_total: require('./total'),
};

/**
 * Run every installed order-total module in ORDER_TOTAL_MODULES order and collect
 * the lines whose title AND text pass tep_not_null(), as
 * { code, title, text, value, sortOrder }.
 *
 * @param {import('../types').Order} order  mutated by ot_shipping
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<{code:string, title:string, text:string, value:(number|string), sortOrder:number}>}
 */
function processAll(order, ctx) {
  throw new NotImplemented('T9', 'processAll');
}

module.exports = { processAll };
