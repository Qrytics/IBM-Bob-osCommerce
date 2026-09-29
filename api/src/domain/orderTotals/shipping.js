'use strict';

/**
 * orderTotals/shipping.js: legacy-baseline/catalog/includes/modules/order_total/ot_shipping.php line 26
 *
 * OWNER: Bob, task T9 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:ot
 *
 * Rules: BR-24, BR-25 (plus Q-07)
 */

const { phpToNumber } = require('../phpNumber');
const { tepNotNull } = require('../general');
const { getTaxRate, getTaxDescription, calculateTax } = require('../tax');
const { format } = require('../currency');
const { FREE_SHIPPING_TITLE } = require('../constants');

/**
 * ot_shipping::process(): ot_shipping.php lines 26-65.
 *
 * MUTATES order.info the way the legacy module mutates $order->info:
 *
 * 1. Free shipping re-check (ot_shipping.php lines 29-46):
 *    Check destination (national/international/both vs storeCountryId).
 *    Key difference from checkout_shipping.php: the threshold comparison uses
 *    (total - shippingCost) >= over — NOT total >= over (Q-07).
 *    If free: set shippingMethod = FREE_SHIPPING_TITLE, total -= shippingCost, shippingCost = 0.
 *
 * 2. module code = selectedShipping.id up to first '_' (ot_shipping.php line 48).
 *    Its tax class is ctx.installedShippingTaxClasses[module] (0 if not found).
 *
 * 3. If tep_not_null(shippingMethod) (ot_shipping.php line 50):
 *    When taxClass > 0:
 *      - shippingTax = getTaxRate(taxClass, delivery)
 *      - taxDescription = getTaxDescription(taxClass, delivery)
 *      - order.info.tax += calculateTax(shippingCost, shippingTax)
 *      - taxGroups[description] += calculateTax(shippingCost, shippingTax)  (or create)
 *      - order.info.total += calculateTax(shippingCost, shippingTax)
 *      - if inclusive: shippingCost += calculateTax(shippingCost, shippingTax)
 *    Emit: title = shippingMethod + ':', value = shippingCost, text = format(shippingCost)
 *
 * BR-24: free-shipping re-check uses (total - shippingCost) as the comparison amount.
 * BR-25: shipping tax is added to order totals if taxClassId > 0.
 * Q-07: when exclusive, shippingCost+tax is included in total used for free-shipping.
 *
 * @param {import('../types').Order} order  MUTATED
 * @param {import('../types').OrderTotalContext} ctx
 * @returns {Array<import('../types').OtLine>} the module's $this->output
 */
function process(order, ctx) {
  const { freeShipping, storeCountryId, selectedShipping, installedShippingTaxClasses,
          catalog, displayPriceWithTax, currency } = ctx;

  // ot_shipping.php lines 29-46: free shipping check
  if (freeShipping.enabled) {
    let pass = false;
    const dest = freeShipping.destination;
    const deliveryCountryId = order.delivery.countryId;

    switch (dest) {
      case 'national':
        if (deliveryCountryId === storeCountryId) pass = true;
        break;
      case 'international':
        if (deliveryCountryId !== storeCountryId) pass = true;
        break;
      case 'both':
        pass = true;
        break;
      default:
        pass = false;
    }

    // ot_shipping.php line 41: (total - shippingCost) >= over
    if (pass &&
        (phpToNumber(order.info.total) - phpToNumber(order.info.shippingCost)) >=
        phpToNumber(freeShipping.over)) {
      order.info.shippingMethod = FREE_SHIPPING_TITLE;
      order.info.total = phpToNumber(order.info.total) - phpToNumber(order.info.shippingCost);
      order.info.shippingCost = 0;
    }
  }

  // ot_shipping.php line 48: module = substr($GLOBALS['shipping']['id'], 0, strpos(..., '_'))
  const shippingId = selectedShipping ? selectedShipping.id : '';
  const underscore = shippingId.indexOf('_');
  const moduleCode = underscore >= 0 ? shippingId.slice(0, underscore) : shippingId;

  // ot_shipping.php line 50: if (tep_not_null($order->info['shipping_method']))
  if (!tepNotNull(order.info.shippingMethod)) {
    return [];
  }

  const output = [];

  // ot_shipping.php line 51: $GLOBALS[$module]->tax_class > 0
  const taxClassId = installedShippingTaxClasses[moduleCode] || 0;
  if (taxClassId > 0) {
    const shippingTax = getTaxRate(catalog, taxClassId, order.delivery.countryId, order.delivery.zoneId);
    const shippingTaxDescription = getTaxDescription(catalog, taxClassId, order.delivery.countryId, order.delivery.zoneId);
    const taxAmount = calculateTax(order.info.shippingCost, shippingTax);

    // ot_shipping.php lines 55-57
    order.info.tax += taxAmount;
    order.info.total += taxAmount;

    // tax_groups: += (create if missing) — ot_shipping.php line 56
    const existingGroup = order.info.taxGroups.find((g) => g.description === shippingTaxDescription);
    if (existingGroup) {
      existingGroup.amount += taxAmount;
    } else {
      order.info.taxGroups.push({ description: shippingTaxDescription, amount: taxAmount });
    }

    // ot_shipping.php line 59: if inclusive, add tax to shippingCost too
    if (displayPriceWithTax) {
      order.info.shippingCost = phpToNumber(order.info.shippingCost) + taxAmount;
    }
  }

  // ot_shipping.php lines 62-64: emit line
  output.push({
    title: order.info.shippingMethod + ':',
    text: format(order.info.shippingCost, currency, true, order.info.currencyValue),
    value: order.info.shippingCost,
  });

  return output;
}

module.exports = { process };
