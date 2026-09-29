'use strict';

/**
 * currency.js: legacy-baseline/catalog/includes/classes/currencies.php
 *
 * OWNER: Bob, task T5 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:currency
 *
 * Rules: BR-07, BR-08 (plus Q-03, Q-10)
 */

const { phpToNumber, phpNumberFormat } = require('./phpNumber');
const { tepRound, tepNotNull } = require('./general');
const { addTax } = require('./tax');

/**
 * currencies::calculate_price($products_price, $products_tax, $quantity): currencies.php line 50.
 *
 *   return tep_round(tep_add_tax($products_price, $products_tax), decimal_places) * $quantity;
 *
 * decimal_places is that of the SELECTED DISPLAY currency, even though prices
 * are in the default currency (Q-10). tep_round is called on the unit price
 * BEFORE multiplying by qty, so rounding error accumulates (Q-03).
 *
 * BR-07: round per-unit then multiply by quantity.
 *
 * @param {number|string} price
 * @param {number} taxRate
 * @param {number} qty
 * @param {import('./types').PricingContext} ctx
 * @returns {number}
 */
function calculatePrice(price, taxRate, qty, ctx) {
  const decimalPlaces = parseInt(ctx.currency.decimal_places, 10);
  // tep_add_tax returns number|string; tepRound accepts both
  const withTax = addTax(price, taxRate, ctx.displayPriceWithTax);
  // tepRound may return a string (when it just truncates) — multiply via phpToNumber (Q-03)
  return phpToNumber(tepRound(withTax, decimalPlaces)) * qty;
}

/**
 * currencies::format($number, $calculate_currency_value, $currency_type, $currency_value): currencies.php lines 35-48.
 *
 * With applyRate (default true):
 *   rate = tep_not_null(rateOverride) ? rateOverride : currency.value
 *   format tep_round($number * rate, decimal_places) with the currency's separators
 * Without applyRate:
 *   format tep_round($number, decimal_places) directly
 * Wrap in symbol_left / symbol_right.
 *
 * BR-08: format() applies the exchange rate and formats with the currency's separators.
 *
 * @param {number|string} number
 * @param {import('./types').Currency} currency
 * @param {boolean} [applyRate=true]
 * @param {string|null} [rateOverride=null]
 * @returns {string} e.g. "$1,010.77" or "183,09€"
 */
function format(number, currency, applyRate = true, rateOverride = null) {
  const decimalPlaces = parseInt(currency.decimal_places, 10);

  let rounded;
  if (applyRate) {
    // tep_not_null($currency_value) ? $currency_value : $this->currencies[$currency_type]['value']
    const rate = tepNotNull(rateOverride) ? rateOverride : currency.value;
    rounded = tepRound(phpToNumber(number) * phpToNumber(rate), decimalPlaces);
  } else {
    rounded = tepRound(number, decimalPlaces);
  }

  const formatted = phpNumberFormat(
    rounded,
    decimalPlaces,
    currency.decimal_point,
    currency.thousands_point
  );

  return currency.symbol_left + formatted + currency.symbol_right;
}

module.exports = { calculatePrice, format };
