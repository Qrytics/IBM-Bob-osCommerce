'use strict';

/**
 * tax.js: tax functions from legacy-baseline/catalog/includes/functions/general.php
 * plus the inline tax-inclusive expression from classes/order.php.
 *
 * OWNER: Bob, task T4 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:tax
 *
 * Rules: BR-02, BR-03, BR-04, BR-05, BR-06, BR-16 (plus Q-06)
 *
 * The legacy code ran SQL against `tax_rates`, `zones_to_geo_zones` and
 * `geo_zones`. Here the same tables arrive as arrays on `catalog`
 * (fixtures/catalog.json). Reproduce the SQL semantics: the LEFT JOIN, the
 * WHERE clause, SUM() per priority and GROUP BY / ORDER BY tax_priority.
 */

// eslint-disable-next-line no-unused-vars
const { phpToString, phpToNumber } = require('./phpNumber');
// eslint-disable-next-line no-unused-vars
const { TEXT_UNKNOWN_TAX_RATE } = require('./constants');
const { NotImplemented } = require('./errors');

/**
 * tep_get_tax_rate($class_id, $country_id, $zone_id): general.php line 328.
 *
 * Rates in the same priority are SUMmed (MySQL decimal(7,4) arithmetic); the
 * priorities are then compounded: multiplier *= 1 + rate/100; result
 * (multiplier - 1) * 100. Returns 0 when no rate matches.
 *
 * @param {import('./types').Catalog} catalog
 * @param {number} taxClassId
 * @param {number} countryId
 * @param {number} zoneId
 * @returns {number} percentage, e.g. 7 or 15.473749999999997
 */
function getTaxRate(catalog, taxClassId, countryId, zoneId) {
  throw new NotImplemented('T4', 'getTaxRate');
}

/**
 * tep_get_tax_description($class_id, $country_id, $zone_id): general.php line 362.
 * Descriptions of the matching rates ordered by priority, joined with " + ".
 * Returns TEXT_UNKNOWN_TAX_RATE when nothing matches.
 * @param {import('./types').Catalog} catalog
 * @param {number} taxClassId
 * @param {number} countryId
 * @param {number} zoneId
 * @returns {string}
 */
function getTaxDescription(catalog, taxClassId, countryId, zoneId) {
  throw new NotImplemented('T4', 'getTaxDescription');
}

/**
 * tep_add_tax($price, $tax): general.php line 385.
 * @param {number|string} price
 * @param {number} taxRate
 * @param {boolean} displayPriceWithTax  DISPLAY_PRICE_WITH_TAX == 'true'
 * @returns {number|string} the price unchanged when tax is not added
 */
function addTax(price, taxRate, displayPriceWithTax) {
  throw new NotImplemented('T4', 'addTax');
}

/**
 * tep_calculate_tax($price, $tax): general.php line 394.
 * The comment says it rounds; the code does not.
 * @param {number|string} price
 * @param {number|string} taxRate
 * @returns {number}
 */
function calculateTax(price, taxRate) {
  throw new NotImplemented('T4', 'calculateTax');
}

/**
 * The tax contained in a tax-inclusive shown price: classes/order.php line 318.
 *
 *   $shown_price - ($shown_price / (($products_tax < 10) ? "1.0" . str_replace('.', '', $products_tax)
 *                                                         : "1." . str_replace('.', '', $products_tax)))
 *
 * The divisor is built by STRING concatenation of the rate's PHP string form (Q-06).
 * @param {number} shownPrice
 * @param {number} taxRate
 * @returns {number}
 */
function inclusiveTaxPortion(shownPrice, taxRate) {
  throw new NotImplemented('T4', 'inclusiveTaxPortion');
}

module.exports = { getTaxRate, getTaxDescription, addTax, calculateTax, inclusiveTaxPortion };
