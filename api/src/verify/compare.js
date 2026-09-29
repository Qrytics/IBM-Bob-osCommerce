'use strict';

/**
 * Compare a modern result with a legacy golden value (PROVIDED, LOCKED).
 *
 * Golden fixtures store numbers the way PHP prints them ((string)(float)$v,
 * precision 14). A modern value matches when it prints the same way after the
 * same PHP normalisation. There is no tolerance: 65.7979 must print as "65.7979".
 *
 * Field kinds are decided by key name, so every fixture file is checked the same way.
 */

const { phpFloatToString, phpToNumber } = require('../domain/phpNumber');

const NUMERIC_KEYS = new Set([
  'total', 'weight', 'shippingWeight', 'cost', 'tax', 'price', 'finalPrice', 'currencyValue',
  'shippingCost', 'subtotal', 'amount', 'value',
]);
const INTEGER_KEYS = new Set(['count', 'numBoxes', 'qty', 'optionId', 'valueId', 'sortOrder']);

/** PHP-normalised string form of a legacy numeric value (null stays null). */
function php(value) {
  if (value === null || value === undefined) return null;
  return phpFloatToString(phpToNumber(value));
}

/**
 * Walk `expected` and collect every place where `actual` differs.
 * @returns {string[]} human-readable differences (empty when equal)
 */
function diff(actual, expected, path = '$', key = null, out = []) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      out.push(`${path}: expected an array of ${expected.length}, got ${JSON.stringify(actual)}`);
      return out;
    }
    if (actual.length !== expected.length) {
      out.push(`${path}: expected ${expected.length} entries, got ${actual.length}`);
    }
    expected.forEach((e, i) => diff(actual[i], e, `${path}[${i}]`, key, out));
    return out;
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object') {
      out.push(`${path}: expected an object, got ${JSON.stringify(actual)}`);
      return out;
    }
    for (const k of Object.keys(expected)) {
      if (k === 'exact') continue; // full-precision inputs for staged checks, not outputs
      diff(actual[k], expected[k], `${path}.${k}`, k, out);
    }
    return out;
  }

  let a;
  let e = expected;
  if (NUMERIC_KEYS.has(key)) {
    a = php(actual);
  } else if (INTEGER_KEYS.has(key)) {
    a = actual === null || actual === undefined ? null : Math.trunc(phpToNumber(actual));
  } else if (typeof expected === 'boolean') {
    a = actual;
  } else {
    a = actual === null || actual === undefined ? '' : String(actual);
    e = expected === null ? '' : expected;
  }
  if (a !== e) out.push(`${path}: expected ${JSON.stringify(e)}, got ${JSON.stringify(a)} (raw ${JSON.stringify(actual)})`);
  return out;
}

/** Jest-friendly assertion: throws with a readable list of differences. */
function expectLegacyEqual(actual, expected, label = '') {
  const d = diff(actual, expected);
  if (d.length) {
    const shown = d.slice(0, 15).join('\n  ');
    throw new Error(`${label} differs from legacy PHP output in ${d.length} place(s):\n  ${shown}${d.length > 15 ? '\n  ...' : ''}`);
  }
}

module.exports = { diff, expectLegacyEqual, php };
