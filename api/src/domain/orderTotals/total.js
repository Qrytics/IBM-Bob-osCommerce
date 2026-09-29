'use strict';

/**
 * orderTotals/total.js: legacy-baseline/catalog/includes/modules/order_total/ot_total.php line 26
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
 * ot_total::process()
 *
 * One line: title C.MODULE_ORDER_TOTAL_TOTAL_TITLE + ':', value order.info.total,
 * text '<strong>' + format(value, ctx.currency, true, order.info.currencyValue) + '</strong>'.
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  throw new NotImplemented('T9', 'ot_total.process');
}

module.exports = { process };
