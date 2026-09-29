'use strict';

/**
 * orderTotals/total.js: legacy-baseline/catalog/includes/modules/order_total/ot_total.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-26
 */

const { format } = require('../currency');
const C = require('../constants');

/**
 * ot_total::process(): ot_total.php lines 26-31.
 *
 * One line: title C.MODULE_ORDER_TOTAL_TOTAL_TITLE + ':', value order.info.total,
 * text '<strong>' + format(value, ctx.currency, true, order.info.currencyValue) + '</strong>'.
 *
 * BR-26: total line shows order.info.total formatted with currency, wrapped in <strong>.
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  const value = order.info.total;
  return [
    {
      title: C.MODULE_ORDER_TOTAL_TOTAL_TITLE + ':',
      text: '<strong>' + format(value, ctx.currency, true, order.info.currencyValue) + '</strong>',
      value,
    },
  ];
}

module.exports = { process };
