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

// eslint-disable-next-line no-unused-vars
const { phpToString, phpToNumber } = require('./phpNumber');
const { NotImplemented } = require('./errors');

/**
 * tep_round($number, $precision): general.php line 305.
 *
 * Rounds by working on the STRING form of the number: find the '.', cut the
 * string one digit past `precision`, and if that last digit is >= 5 add
 * 0.0…1 to the truncated string, otherwise return the truncated string.
 * For floats that PHP prints in exponent form (e.g. "1.0E-5") this gives
 * surprising results; they must be reproduced (see Q-01).
 *
 * @param {number|string} number  a float, or a numeric string straight from the DB (e.g. "10.0050")
 * @param {number} precision      decimal places (currency decimal_places, 0-4)
 * @returns {number|string}       whatever the legacy code returns (number or truncated string)
 */
function tepRound(number, precision) {
  throw new NotImplemented('T3', 'tepRound');
}

/**
 * tep_not_null($value): general.php line 1167.
 * PHP 7 loose comparison applies: for example 0 != '' is false.
 * @param {*} value
 * @returns {boolean}
 */
function tepNotNull(value) {
  throw new NotImplemented('T3', 'tepNotNull');
}

/**
 * tep_get_uprid($prid, $params): general.php line 943.
 * Builds the cart key "productId{optionId}valueId{optionId}valueId…" in attribute order.
 * @param {number} productId
 * @param {Array<{optionId:number, valueId:number}>} attributes
 * @returns {string} e.g. "1{4}2{3}6", or "3" when there are no attributes
 */
function tepGetUprid(productId, attributes) {
  throw new NotImplemented('T3', 'tepGetUprid');
}

module.exports = { tepRound, tepNotNull, tepGetUprid };
