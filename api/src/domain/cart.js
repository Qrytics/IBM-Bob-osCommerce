'use strict';

/**
 * cart.js: legacy-baseline/catalog/includes/classes/shopping_cart.php
 *
 * OWNER: Bob, task T6 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:cart
 *
 * Rules: BR-09, BR-10, BR-11, BR-12 (plus Q-04, Q-05, Q-08)
 *
 * The legacy class queried `products`, `specials` and `products_attributes`
 * with SQL. Here those tables are arrays on `catalog`; `(int)` casts and
 * "first matching row" semantics still apply.
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber } = require('./phpNumber');
// eslint-disable-next-line no-unused-vars
const { tepGetUprid } = require('./general');
// eslint-disable-next-line no-unused-vars
const { getTaxRate } = require('./tax');
// eslint-disable-next-line no-unused-vars
const { calculatePrice } = require('./currency');
const { NotImplemented } = require('./errors');

/**
 * shoppingCart::calculate(), plus count_contents(): shopping_cart.php lines 261 and 203.
 *
 * The visitor is a guest, so tep_get_tax_rate() is called WITHOUT a location and
 * falls back to the STORE location (catalog.store), not the delivery address (Q-05).
 * The product price and each attribute price go through calculate_price()
 * separately, and each is rounded separately (Q-04).
 *
 * @param {Array<import('./types').CartItem>} items
 * @param {import('./types').Catalog} catalog
 * @param {import('./types').PricingContext} ctx
 * @returns {import('./types').CartTotals}
 */
function calculateCart(items, catalog, ctx) {
  throw new NotImplemented('T6', 'calculateCart');
}

/**
 * shoppingCart::attributes_price($products_id): shopping_cart.php line 306.
 * Sum of the attribute prices ('+' adds, anything else subtracts), unrounded, untaxed.
 * @param {import('./types').CartItem} item
 * @param {import('./types').Catalog} catalog
 * @returns {number}
 */
function attributesPrice(item, catalog) {
  throw new NotImplemented('T6', 'attributesPrice');
}

/**
 * shoppingCart::get_products(): shopping_cart.php line 325.
 * @param {Array<import('./types').CartItem>} items
 * @param {import('./types').Catalog} catalog
 * @returns {Array<import('./types').CartProduct>}
 */
function getProducts(items, catalog) {
  throw new NotImplemented('T6', 'getProducts');
}

module.exports = { calculateCart, attributesPrice, getProducts };
