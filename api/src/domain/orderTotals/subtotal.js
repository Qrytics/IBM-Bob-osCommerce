'use strict';

/**
 * orderTotals/subtotal.js: legacy-baseline/catalog/includes/modules/order_total/ot_subtotal.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-26
 */

// eslint-disable-next-line no-unused-vars
const { format } = require('../currency');
// eslint-disable-next-line no-unused-vars
const C = require('../constants');
const { NotImplemented } = require('../errors');

/**
 * ot_subtotal::process()
 *
 * One line: title C.MODULE_ORDER_TOTAL_SUBTOTAL_TITLE + ':', value order.info.subtotal,
 * text format(value, ctx.currency, true, order.info.currencyValue).
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  throw new NotImplemented('T9', 'ot_subtotal.process');
}

module.exports = { process };
