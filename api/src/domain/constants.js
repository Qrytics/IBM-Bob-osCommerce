'use strict';

/**
 * Language strings and fixed configuration used by the pricing slice
 * (PROVIDED, LOCKED). Values come from legacy-baseline/catalog/includes/languages/english*
 * and legacy-harness/lib/bootstrap.php, so the modern output text matches the legacy text.
 */

module.exports = Object.freeze({
  // languages/english.php
  TEXT_UNKNOWN_TAX_RATE: 'Unknown tax rate',

  // languages/english/modules/order_total/*.php
  MODULE_ORDER_TOTAL_SUBTOTAL_TITLE: 'Sub-Total',
  MODULE_ORDER_TOTAL_SHIPPING_TITLE: 'Shipping',
  MODULE_ORDER_TOTAL_TAX_TITLE: 'Tax',
  MODULE_ORDER_TOTAL_TOTAL_TITLE: 'Total',
  FREE_SHIPPING_TITLE: 'Free Shipping',

  // languages/english/modules/shipping/*.php
  MODULE_SHIPPING_FLAT_TEXT_TITLE: 'Flat Rate',
  MODULE_SHIPPING_FLAT_TEXT_WAY: 'Best Way',
  MODULE_SHIPPING_ITEM_TEXT_TITLE: 'Per Item',
  MODULE_SHIPPING_ITEM_TEXT_WAY: 'Best Way',
  MODULE_SHIPPING_TABLE_TEXT_TITLE: 'Table Rate',
  MODULE_SHIPPING_TABLE_TEXT_WAY: 'Best Way',

  // Order-total modules in MODULE_ORDER_TOTAL_INSTALLED order, with sort orders (bootstrap.php)
  ORDER_TOTAL_MODULES: Object.freeze([
    Object.freeze({ code: 'ot_subtotal', sortOrder: 1 }),
    Object.freeze({ code: 'ot_shipping', sortOrder: 2 }),
    Object.freeze({ code: 'ot_tax', sortOrder: 3 }),
    Object.freeze({ code: 'ot_total', sortOrder: 4 }),
  ]),

  // Defaults when a request omits them (same defaults as the legacy harness)
  DEFAULT_SHIPPING_BOX: Object.freeze({ weight: '3', padding: '10', maxWeight: '50' }),
  DEFAULT_FREE_SHIPPING: Object.freeze({ enabled: false, over: '50', destination: 'national' }),
});
