'use strict';

/**
 * shipping/item.js: legacy-baseline/catalog/includes/modules/shipping/item.php lines 48 and 93
 *
 * OWNER: Bob, task T8 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:shipping
 *
 * Rules: BR-20, BR-22
 */

const { phpToNumber } = require('../phpNumber');
const { getTaxRate } = require('../tax');
const C = require('../constants');

/**
 * item::quote(): item.php lines 48-66.
 *
 * cost = config.cost × number of items ($total_count, i.e. cartCount; content type is
 * 'physical') + config.handling.
 * Returns { id: 'item', module: C.MODULE_SHIPPING_ITEM_TEXT_TITLE,
 *           methods: [{ id: 'item', title: C.MODULE_SHIPPING_ITEM_TEXT_WAY, cost }] }
 * plus `tax` (tep_get_tax_rate for the delivery location) only when config.taxClassId > 0.
 *
 * getNumberOfItems() (item.php line 93): since content_type is always 'physical',
 * $number_of_items = $total_count (cartCount) directly.
 *
 * BR-20: per-item rate = cost × cartCount + handling.
 * BR-22: shipping tax is added to the quote when taxClassId > 0.
 *
 * @param {import('../types').QuoteContext} ctx
 * @returns {import('../types').Quote}
 */
function quote(ctx) {
  const { config, order, catalog, cartCount } = ctx;
  const costPerItem = phpToNumber(config.cost);
  const handling = phpToNumber(config.handling);

  // item.php line 57: cost = MODULE_SHIPPING_ITEM_COST * number_of_items + HANDLING
  // content_type is 'physical', so number_of_items = total_count = cartCount
  const cost = costPerItem * cartCount + handling;

  const result = {
    id: 'item',
    module: C.MODULE_SHIPPING_ITEM_TEXT_TITLE,
    methods: [
      {
        id: 'item',
        title: C.MODULE_SHIPPING_ITEM_TEXT_WAY,
        cost,
      },
    ],
  };

  // item.php line 59-61: add tax when tax class is set
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
