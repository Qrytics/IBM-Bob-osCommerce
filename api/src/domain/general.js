'use strict';

/**
 * general.js: helpers from legacy-baseline/catalog/includes/functions/general.php
 *
 * OWNER: Bob, task T3 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:general
 *
 * Rules: BR-01 (plus Q-01, Q-02 in docs/legacy-quirks.md)
 *
 * Reproduce the legacy behaviour exactly, bugs included. Use the helpers in
 * ./phpNumber.js wherever PHP converted between strings and numbers implicitly.
 */

const { phpToString, phpToNumber } = require('./phpNumber');

/**
 * tep_round($number, $precision): general.php lines 305-323.
 *
 * Rounds by working on the STRING form of the number (via phpToString so PHP's
 * own float→string conversion is reproduced, e.g. 1e-5 → "1.0E-5" giving Q-01).
 * The algorithm:
 *   1. Find the '.' in the string (strpos). If there is no '.', OR if the '.'
 *      is at position 0 (falsy in PHP — Q-02), the whole block is skipped.
 *   2. Check that the fractional part has more digits than `precision`.
 *   3. Truncate to precision+1 digits after the dot.
 *   4. If the last digit >= 5 (PHP compares non-numeric string with 0, so
 *      any non-digit char satisfies this — Q-01 quirk), add the appropriate
 *      rounding increment; otherwise drop the last digit.
 *
 * BR-01: tepRound is used everywhere a price needs to be rounded to the
 * currency's decimal_places.
 * Q-01: exponent-form strings ("1.0E-5") confuse the dot-finding logic.
 * Q-02: when the dot is at index 0 (never happens in practice with finite
 *       prices, but the strpos check is falsy-0).
 *
 * @param {number|string} number  a float, or a numeric string straight from the DB (e.g. "10.0050")
 * @param {number} precision      decimal places (currency decimal_places, 0-4)
 * @returns {number|string}       whatever the legacy code returns (number or truncated string)
 */
function tepRound(number, precision) {
  // PHP implicitly converts $number to a string for strpos/substr.
  let s = phpToString(number);

  // strpos($number, '.') — returns false when not found, or the integer index.
  // In PHP "if (0)" is falsy, so a dot at position 0 also skips the block (Q-02).
  const dotPos = s.indexOf('.');
  if (dotPos > 0) {
    // strlen(substr($number, strpos($number,'.')+1)) — digits after the dot
    const afterDot = s.slice(dotPos + 1);
    if (afterDot.length > precision) {
      // Cut to precision+1 digits after the dot (general.php line 307)
      s = s.slice(0, dotPos + 1 + precision + 1);

      // substr($number, -1) >= 5: PHP compares the last CHAR with integer 5.
      // A non-numeric char (like 'E') coerces to 0 in numeric context → 0 >= 5 is false.
      const lastChar = s.slice(-1);
      if (phpToNumber(lastChar) >= 5) {
        // Round up: add 0.0…01 (precision places) or 0.1 or 1
        const truncated = s.slice(0, -1);
        if (precision > 1) {
          // '0.' + str_repeat(0, precision-1) + '1'
          const increment = phpToNumber('0.' + '0'.repeat(precision - 1) + '1');
          number = phpToNumber(truncated) + increment;
        } else if (precision === 1) {
          number = phpToNumber(truncated) + 0.1;
        } else {
          number = phpToNumber(truncated) + 1;
        }
      } else {
        // Just drop the last digit — return as string (general.php line 318)
        number = s.slice(0, -1);
      }
    }
  }

  return number;
}

/**
 * tep_not_null($value): general.php lines 1167-1181.
 *
 * PHP loose comparisons:
 *  - Arrays: true iff sizeof > 0.
 *  - Other: true iff value != '' AND strtolower(value) != 'null' AND strlen(trim(value)) > 0.
 * Note: PHP `0 != ''` is FALSE (both coerce to 0), so `0` is considered null here.
 *
 * @param {*} value
 * @returns {boolean}
 */
function tepNotNull(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  const s = String(value === null || value === undefined ? '' : value);
  // PHP: ($value != '') — loose comparison: 0 != '' is false, '' != '' is false
  // We replicate: phpToNumber('') == phpToNumber(value) when both are 0 → equal → false
  // Simplest faithful: value != '' in PHP means: not loosely equal to ''
  // In PHP: '' == '' (true), '0' == '' (false), 0 == '' (true), null == '' (true), 'null' == '' (false)
  // So: for non-array, check that value is not PHP-loosely-equal to '':
  //   phpToNumber(value) !== 0 OR (string form is not all-numeric and not empty)
  // Actual PHP rule: $value != '' is false when $value is '', null, false, or 0 (numeric).
  // Replicate: convert both sides using PHP's loose comparison rules.
  // '' in PHP is 0 numerically; so $value != '' is false when phpToNumber(value) == 0 AND
  // the string is purely numeric. Actually the PHP loose comparison for string != string
  // checks if both are numeric strings: if so compares numerically, else compares as strings.
  // For our use-case, the simplest and correct approach is:
  // PHP: ($value != '') → in JS: phpToNumber(s) !== 0 || (s !== '' && isNaN(Number(s)))
  // But let's think more carefully about the actual string values that appear:
  // '' → false (value == '' is true)
  // '0' → false? No: PHP '0' != '' → '0' is numeric, '' is numeric(0), 0 == 0 → false? 
  // Actually in PHP: var_dump(0 != '') → bool(false), var_dump('0' != '') → bool(true) since 
  // '0' is a string and '' is a string, compared as strings: '0' !== '' → true.
  // Wait, actually PHP string comparison: if both numeric strings compare as numbers.
  // '' is NOT a numeric string, so '0' != '' does string compare: '0' !== '' → true.
  // But 0 (int) != '' → int vs string → convert '' to 0 → 0 != 0 → false.
  // For our purposes, the inputs are strings from DB or user input, not bare integers 0.
  // The stub says: "0 != '' is false" — so for the integer 0, not_null returns false.
  
  // Simple faithful implementation:
  // value != '' (PHP loose): false when value is '', null, false, or integer/float 0
  const notEqualToEmpty = !(value === '' || value === null || value === undefined || value === false || value === 0);
  const notNull = s.toLowerCase() !== 'null';
  const notBlank = s.trim().length > 0;
  return notEqualToEmpty && notNull && notBlank;
}

/**
 * tep_get_uprid($prid, $params): general.php lines 943-990.
 *
 * Builds the cart key "productId{optionId}valueId{optionId}valueId…" in
 * attribute insertion order. The $params array maps optionId → valueId.
 *
 * @param {number} productId
 * @param {Array<{optionId:number, valueId:number}>} attributes
 * @returns {string} e.g. "1{4}2{3}6", or "3" when there are no attributes
 */
function tepGetUprid(productId, attributes) {
  // (int)$prid
  let uprid = String(Math.trunc(phpToNumber(productId)));

  if (Array.isArray(attributes) && attributes.length > 0) {
    let attributesCheck = true;
    let attributesIds = '';

    for (const attr of attributes) {
      const option = attr.optionId;
      const value = attr.valueId;
      // is_numeric checks: both must be numeric
      if (
        (typeof option === 'number' || (typeof option === 'string' && option.trim() !== '' && !isNaN(Number(option)))) &&
        (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))))
      ) {
        attributesIds += '{' + Math.trunc(phpToNumber(option)) + '}' + Math.trunc(phpToNumber(value));
      } else {
        attributesCheck = false;
        break;
      }
    }

    if (attributesCheck) {
      uprid += attributesIds;
    }
  }

  return uprid;
}

module.exports = { tepRound, tepNotNull, tepGetUprid };
