'use strict';

/**
 * orderTotals/shipping.js: legacy-baseline/catalog/includes/modules/order_total/ot_shipping.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-24, BR-25 (plus Q-07)
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('../phpNumber');
// eslint-disable-next-line no-unused-vars
const { tepNotNull } = require('../general');
// eslint-disable-next-line no-unused-vars
const { getTaxRate, getTaxDescription, calculateTax } = require('../tax');
// eslint-disable-next-line no-unused-vars
const { format } = require('../currency');
// eslint-disable-next-line no-unused-vars
const C = require('../constants');
const { NotImplemented } = require('../errors');

/**
 * ot_shipping::process()
 *
 * MUTATES order.info the way the legacy module mutates $order->info:
 *   1. Free shipping: when enabled and the destination passes (national / international
 *      / both, compared with ctx.storeCountryId) and total - shippingCost >= over:
 *      shippingMethod = FREE_SHIPPING_TITLE, total -= shippingCost, shippingCost = 0.
 *   2. module = selectedShipping.id up to the first '_'; its tax class is
 *      ctx.installedShippingTaxClasses[module] (undefined counts as 0).
 *   3. If tep_not_null(shippingMethod): when that tax class > 0, add
 *      tep_calculate_tax(shippingCost, rate) to tax, to the tax group named by
 *      tep_get_tax_description(...) (creating it if needed) and to total, and when
 *      prices include tax also to shippingCost. Then output one line: title
 *      shippingMethod + ':', value shippingCost, text format(shippingCost, ...).
 *
 * @param {import('../types').Order} order
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  throw new NotImplemented('T9', 'ot_shipping.process');
}

module.exports = { process };
