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

const { phpToString, phpToNumber } = require('./phpNumber');
const { TEXT_UNKNOWN_TAX_RATE } = require('./constants');

/**
 * Replicates the LEFT JOIN / WHERE logic of tep_get_tax_rate's SQL query.
 *
 * SQL (general.php line 343):
 *   SELECT ... FROM tax_rates tr
 *   LEFT JOIN zones_to_geo_zones za ON (tr.tax_zone_id = za.geo_zone_id)
 *   LEFT JOIN geo_zones tz ON (tz.geo_zone_id = tr.tax_zone_id)
 *   WHERE (za.zone_country_id IS NULL OR za.zone_country_id = '0' OR za.zone_country_id = $countryId)
 *     AND (za.zone_id IS NULL OR za.zone_id = '0' OR za.zone_id = $zoneId)
 *     AND tr.tax_class_id = $classId
 *
 * The LEFT JOIN means that a tax_rate row with a tax_zone_id that has NO
 * matching zones_to_geo_zones rows produces NULL columns for za.* — and NULL
 * satisfies the IS NULL condition, so the rate matches everywhere (BR-02).
 *
 * @param {import('./types').Catalog} catalog
 * @param {number} taxClassId
 * @param {number} countryId
 * @param {number} zoneId
 * @returns {Array<{tax_priority:number, tax_rate:string, tax_description:string}>} matching rows
 */
function matchingRates(catalog, taxClassId, countryId, zoneId) {
  const results = [];
  for (const tr of catalog.tax_rates) {
    if (tr.tax_class_id !== taxClassId) continue;

    // Find all zones_to_geo_zones rows for this tax_zone_id (LEFT JOIN).
    const zaRows = catalog.zones_to_geo_zones.filter(
      (za) => za.geo_zone_id === tr.tax_zone_id
    );

    if (zaRows.length === 0) {
      // No association rows → LEFT JOIN produces NULL → IS NULL condition is true → matches
      results.push(tr);
    } else {
      // At least one association row must satisfy the WHERE conditions
      for (const za of zaRows) {
        const countryMatch =
          za.zone_country_id === null ||
          za.zone_country_id === 0 ||
          za.zone_country_id === countryId;
        const zoneMatch =
          za.zone_id === null ||
          za.zone_id === 0 ||
          za.zone_id === zoneId;
        if (countryMatch && zoneMatch) {
          results.push(tr);
          break; // one matching association is enough to include the rate
        }
      }
    }
  }
  return results;
}

/**
 * tep_get_tax_rate($class_id, $country_id, $zone_id): general.php lines 328-357.
 *
 * SQL groups by tax_priority (ascending, MySQL default), computes SUM(tax_rate)
 * per group (MySQL DECIMAL(7,4) arithmetic — we replicate by summing in
 * ten-thousandths). Then compounds across priorities:
 *   multiplier *= 1 + rate/100
 * and returns (multiplier - 1) * 100.
 *
 * BR-02: LEFT JOIN means a rate with no geo-zone rows matches all locations.
 * BR-03: Rates in the same priority are SUMmed before compounding.
 * BR-04: Returns 0 when nothing matches.
 *
 * @param {import('./types').Catalog} catalog
 * @param {number} taxClassId
 * @param {number} countryId
 * @param {number} zoneId
 * @returns {number} percentage, e.g. 7 or 15.473749999999997
 */
function getTaxRate(catalog, taxClassId, countryId, zoneId) {
  const rows = matchingRates(catalog, taxClassId, countryId, zoneId);
  if (rows.length === 0) return 0;

  // GROUP BY tax_priority (ascending) then SUM(tax_rate) per group.
  // MySQL DECIMAL(7,4) arithmetic: sum in ten-thousandths (integer) to avoid
  // floating-point drift, then divide by 10000.
  const groups = new Map();
  for (const row of rows) {
    const p = row.tax_priority;
    // tax_rate is a DECIMAL(7,4) string like "7.0000" or "9.9750"
    const rate10k = Math.round(phpToNumber(row.tax_rate) * 10000);
    groups.set(p, (groups.get(p) || 0) + rate10k);
  }

  // Sort ascending by priority (MySQL GROUP BY default ordering)
  const sortedPriorities = [...groups.keys()].sort((a, b) => a - b);

  // Compound: multiplier *= 1 + rate/100
  let multiplier = 1.0;
  for (const p of sortedPriorities) {
    const rate = groups.get(p) / 10000; // back to decimal percentage
    multiplier *= 1.0 + rate / 100;
  }

  return (multiplier - 1.0) * 100;
}

/**
 * tep_get_tax_description($class_id, $country_id, $zone_id): general.php lines 362-381.
 *
 * SQL: SELECT tax_description ... ORDER BY tr.tax_priority.
 * Descriptions are joined with ' + ' (trailing ' + ' stripped by substr($s, 0, -3)).
 * Returns TEXT_UNKNOWN_TAX_RATE when nothing matches (BR-04, Q-09).
 *
 * @param {import('./types').Catalog} catalog
 * @param {number} taxClassId
 * @param {number} countryId
 * @param {number} zoneId
 * @returns {string}
 */
function getTaxDescription(catalog, taxClassId, countryId, zoneId) {
  const rows = matchingRates(catalog, taxClassId, countryId, zoneId);
  if (rows.length === 0) return TEXT_UNKNOWN_TAX_RATE;

  // ORDER BY tax_priority ascending (MySQL default)
  const sorted = rows.slice().sort((a, b) => a.tax_priority - b.tax_priority);

  let desc = '';
  for (const row of sorted) {
    desc += row.tax_description + ' + ';
  }
  // substr($tax_description, 0, -3) — remove trailing ' + '
  return desc.slice(0, -3);
}

/**
 * tep_add_tax($price, $tax): general.php lines 385-391.
 *
 * When DISPLAY_PRICE_WITH_TAX is true and tax > 0, adds tep_calculate_tax to
 * the price. Otherwise returns the price unchanged.
 *
 * BR-05: addTax passes through when tax is 0 or displayPriceWithTax is false.
 *
 * @param {number|string} price
 * @param {number} taxRate
 * @param {boolean} displayPriceWithTax  DISPLAY_PRICE_WITH_TAX == 'true'
 * @returns {number|string} the price unchanged when tax is not added
 */
function addTax(price, taxRate, displayPriceWithTax) {
  if (displayPriceWithTax && taxRate > 0) {
    return phpToNumber(price) + calculateTax(price, taxRate);
  }
  return price;
}

/**
 * tep_calculate_tax($price, $tax): general.php lines 394-396.
 *
 * Returns $price * $tax / 100 (no rounding; the comment in the source is wrong).
 * BR-06: calculateTax multiplies price by rate/100.
 *
 * @param {number|string} price
 * @param {number|string} taxRate
 * @returns {number}
 */
function calculateTax(price, taxRate) {
  return phpToNumber(price) * phpToNumber(taxRate) / 100;
}

/**
 * The tax contained in a tax-inclusive shown price: classes/order.php line 318.
 *
 *   $shown_price - ($shown_price / (($products_tax < 10) ? "1.0" . str_replace('.', '', $products_tax)
 *                                                         : "1." . str_replace('.', '', $products_tax)))
 *
 * The divisor is built by STRING concatenation of the rate's PHP string form (Q-06).
 * For rate 9.975: phpToString(9.975) = "9.975", str_replace('.','','9.975') = "9975",
 *   rate < 10 → divisor = "1.0" + "9975" = "1.09975" → 1.09975.
 * For rate 100: phpToString(100) = "100", str_replace → "100",
 *   rate >= 10 → divisor = "1." + "100" = "1.100" (bug: should be 2.0, see Q-06).
 *
 * BR-16: tax portion back-out from inclusive price.
 *
 * @param {number} shownPrice
 * @param {number} taxRate
 * @returns {number}
 */
function inclusiveTaxPortion(shownPrice, taxRate) {
  // str_replace('.', '', phpToString(taxRate))
  const rateStr = phpToString(taxRate).split('.').join('');
  // ternary: $products_tax < 10
  const divisorStr = taxRate < 10 ? '1.0' + rateStr : '1.' + rateStr;
  const divisor = phpToNumber(divisorStr);
  return shownPrice - shownPrice / divisor;
}

module.exports = { getTaxRate, getTaxDescription, addTax, calculateTax, inclusiveTaxPortion };
