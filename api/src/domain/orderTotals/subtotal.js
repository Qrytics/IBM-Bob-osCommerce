'use strict';

/**
 * orderTotals/subtotal.js: legacy-baseline/catalog/includes/modules/order_total/ot_subtotal.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-26
 */

const { format } = require('../currency');
const C = require('../constants');

/**
 * ot_subtotal::process(): ot_subtotal.php lines 26-31.
 *
 * One line: title C.MODULE_ORDER_TOTAL_SUBTOTAL_TITLE + ':', value order.info.subtotal,
 * text format(value, ctx.currency, true, order.info.currencyValue).
 *
 * BR-26: subtotal line shows order.info.subtotal formatted with currency.
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  const value = order.info.subtotal;
  return [
    {
      title: C.MODULE_ORDER_TOTAL_SUBTOTAL_TITLE + ':',
      text: format(value, ctx.currency, true, order.info.currencyValue),
      value,
    },
  ];
}

module.exports = { process };
