'use strict';

/**
 * orderTotals/tax.js: legacy-baseline/catalog/includes/modules/order_total/ot_tax.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-27 (plus Q-09)
 */

const { format } = require('../currency');

/**
 * ot_tax::process(): ot_tax.php lines 26-35.
 *
 * One line per entry of order.info.taxGroups whose amount > 0, in order:
 * title description + ':', value amount, text format(amount, ctx.currency, true, order.info.currencyValue).
 *
 * Q-09: "Unknown tax rate" groups with amount = 0 are silently skipped (> 0 check).
 * BR-27: tax lines are emitted only for non-zero groups.
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  const output = [];
  // ot_tax.php lines 29-35: iterate taxGroups, emit lines with value > 0
  for (const group of order.info.taxGroups) {
    if (group.amount > 0) {
      output.push({
        title: group.description + ':',
        text: format(group.amount, ctx.currency, true, order.info.currencyValue),
        value: group.amount,
      });
    }
  }
  return output;
}

module.exports = { process };
