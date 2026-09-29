'use strict';

/**
 * currency.js: legacy-baseline/catalog/includes/classes/currencies.php
 *
 * OWNER: Bob, task T5 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:currency
 *
 * Rules: BR-07, BR-08 (plus Q-03, Q-10)
 */

// eslint-disable-next-line no-unused-vars
const { phpToNumber, phpNumberFormat } = require('./phpNumber');
// eslint-disable-next-line no-unused-vars
const { tepRound, tepNotNull } = require('./general');
// eslint-disable-next-line no-unused-vars
const { addTax } = require('./tax');
const { NotImplemented } = require('./errors');

/**
 * currencies::calculate_price($products_price, $products_tax, $quantity): currencies.php line 50.
 *
 *   return tep_round(tep_add_tax($products_price, $products_tax), decimal_places) * $quantity;
 *
 * decimal_places is that of the SELECTED DISPLAY currency, even though prices
 * are in the default currency (Q-10).
 *
 * @param {number|string} price
 * @param {number} taxRate
 * @param {number} qty
 * @param {import('./types').PricingContext} ctx
 * @returns {number}
 */
function calculatePrice(price, taxRate, qty, ctx) {
  throw new NotImplemented('T5', 'calculatePrice');
}

/**
 * currencies::format($number, $calculate_currency_value, $currency_type, $currency_value): currencies.php line 35.
 *
 * With applyRate, multiply by `rateOverride` when tep_not_null(rateOverride),
 * otherwise by currency.value. Then tep_round() to decimal_places,
 * number_format() with the currency's separators, and wrap in symbol_left/right.
 *
 * @param {number|string} number
 * @param {import('./types').Currency} currency
 * @param {boolean} [applyRate=true]
 * @param {string|null} [rateOverride=null]
 * @returns {string} e.g. "$1,010.77" or "183,09€"
 */
function format(number, currency, applyRate = true, rateOverride = null) {
  throw new NotImplemented('T5', 'format');
}

module.exports = { calculatePrice, format };
