'use strict';

/**
 * order.js: order::cart() in legacy-baseline/catalog/includes/classes/order.php
 *
 * OWNER: Bob, task T7 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:order
 *
 * Rules: BR-13, BR-14, BR-15, BR-16, BR-17 (plus Q-04, Q-06, Q-09)
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('./phpNumber');
// eslint-disable-next-line no-unused-vars
const { getTaxRate, getTaxDescription, inclusiveTaxPortion } = require('./tax');
// eslint-disable-next-line no-unused-vars
const { calculatePrice } = require('./currency');
// eslint-disable-next-line no-unused-vars
const { getProducts } = require('./cart');
const { NotImplemented } = require('./errors');

/**
 * order::cart(): order.php line 133 (the math is at lines 281-340).
 *
 * The order is built for a guest whose delivery address is `delivery`. Product tax
 * uses the delivery location (BR-14). Customer/billing address lookups are not
 * part of the slice.
 *
 * info starts as:
 *   { currency: currency.code, currencyValue: currency.value,
 *     shippingMethod: shipping.title  ('' when shipping is null),
 *     shippingCost:   shipping.cost   (0 when shipping is null),
 *     subtotal: 0, tax: 0, taxGroups: [], total }
 * taxGroups is an array of { description, amount } in first-seen order, which
 * mirrors the PHP associative array $this->info['tax_groups'].
 *
 * @param {Array<import('./types').CartItem>} items
 * @param {import('./types').Catalog} catalog
 * @param {{pricing: import('./types').PricingContext, delivery: import('./types').Location, shipping: (import('./types').ShippingSelection|null)}} ctx
 * @returns {import('./types').Order}  contentType is always 'physical'
 */
function buildOrder(items, catalog, ctx) {
  throw new NotImplemented('T7', 'buildOrder');
}

module.exports = { buildOrder };
