'use strict';

/**
 * orderTotals/tax.js: legacy-baseline/catalog/includes/modules/order_total/ot_tax.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-27 (plus Q-09)
 */

// eslint-disable-next-line no-unused-vars
const { format } = require('../currency');
const { NotImplemented } = require('../errors');

/**
 * ot_tax::process()
 *
 * One line per entry of order.info.taxGroups whose amount > 0, in order:
 * title description + ':', value amount, text format(amount, ctx.currency, true, order.info.currencyValue).
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  throw new NotImplemented('T9', 'ot_tax.process');
}

module.exports = { process };
