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

const { tepNotNull } = require('../general');
const { ORDER_TOTAL_MODULES } = require('../constants');

const MODULES = {
  ot_subtotal: require('./subtotal'),
  ot_shipping: require('./shipping'),
  ot_tax: require('./tax'),
  ot_total: require('./total'),
};

/**
 * order_total::process(): order_total.php lines 34-57.
 *
 * Run every installed order-total module in ORDER_TOTAL_MODULES order and collect
 * the lines whose title AND text pass tep_not_null(), as
 * { code, title, text, value, sortOrder }.
 *
 * BR-28: processAll drives ot_subtotal → ot_shipping (mutates order) → ot_tax → ot_total.
 *
 * @param {import('../types').Order} order  mutated by ot_shipping
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<{code:string, title:string, text:string, value:(number|string), sortOrder:number}>}
 */
function processAll(order, ctx) {
  const orderTotalArray = [];

  // order_total.php lines 37-53: iterate modules in install order
  for (const mod of ORDER_TOTAL_MODULES) {
    const m = MODULES[mod.code];
    if (!m) continue;

    const output = m.process(order, ctx);

    // order_total.php lines 44-51: collect lines that pass tep_not_null for title AND text
    for (const line of output) {
      if (tepNotNull(line.title) && tepNotNull(line.text)) {
        orderTotalArray.push({
          code: mod.code,
          title: line.title,
          text: line.text,
          value: line.value,
          sortOrder: mod.sortOrder,
        });
      }
    }
  }

  return orderTotalArray;
}

module.exports = { processAll };
