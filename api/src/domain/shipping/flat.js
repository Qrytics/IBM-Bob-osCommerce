'use strict';

/**
 * shipping/flat.js: legacy-baseline/catalog/includes/modules/shipping/flat.php line 48
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-19, BR-22
 */

const { phpToNumber } = require('../phpNumber');
const { getTaxRate } = require('../tax');
const C = require('../constants');

/**
 * flat::quote(): flat.php lines 48-64.
 *
 * cost = MODULE_SHIPPING_FLAT_COST (config.cost).
 * Returns { id: 'flat', module: C.MODULE_SHIPPING_FLAT_TEXT_TITLE,
 *           methods: [{ id: 'flat', title: C.MODULE_SHIPPING_FLAT_TEXT_WAY, cost }] }
 * plus `tax` (tep_get_tax_rate for the delivery location) only when config.taxClassId > 0.
 *
 * BR-19: flat rate returns the configured cost with optional tax.
 * BR-22: shipping tax is added to the quote when taxClassId > 0.
 *
 * @param {import('../types').QuoteContext} ctx
 * @returns {import('../types').Quote}
 */
function quote(ctx) {
  const { config, order, catalog } = ctx;
  const cost = phpToNumber(config.cost);

  const result = {
    id: 'flat',
    module: C.MODULE_SHIPPING_FLAT_TEXT_TITLE,
    methods: [
      {
        id: 'flat',
        title: C.MODULE_SHIPPING_FLAT_TEXT_WAY,
        cost,
      },
    ],
  };

  // flat.php line 57-59: add tax when tax class is set
  if (config.taxClassId > 0) {
    result.tax = getTaxRate(
      catalog,
      config.taxClassId,
      order.delivery.countryId,
      order.delivery.zoneId
    );
  }

  return result;
}

module.exports = { quote };
