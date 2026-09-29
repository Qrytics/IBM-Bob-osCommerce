'use strict';

/**
 * LOCKED. Proves the provided PHP-semantics helpers match real PHP 7.4.
 */

const path = require('node:path');
const fs = require('node:fs');
const p = require('../../src/domain/phpNumber');

const golden = (group) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../fixtures/golden/functions', `${group}.json`), 'utf8')).cases;

describe('phpNumber vs. PHP 7.4 built-ins', () => {
  test.each(golden('php_float_to_string').map((c) => [String(c.args[0]), c]))('(string)(float) %s', (_, c) => {
    expect(p.phpFloatToString(c.args[0])).toBe(c.expected);
  });

  test.each(golden('php_to_number').map((c) => [JSON.stringify(c.args[0]), c]))('numeric coercion of %s', (_, c) => {
    expect(p.phpFloatToString(p.phpToNumber(c.args[0]))).toBe(c.expected);
  });

  test.each(golden('php_number_format').map((c) => [JSON.stringify(c.args), c]))('number_format(%s)', (_, c) => {
    expect(p.phpNumberFormat(...c.args)).toBe(c.expected);
  });
});

describe('phpNumber edge cases', () => {
  test('special values', () => {
    expect(p.phpFloatToString(NaN)).toBe('NAN');
    expect(p.phpFloatToString(Infinity)).toBe('INF');
    expect(p.phpFloatToString(-Infinity)).toBe('-INF');
    expect(p.phpFloatToString(-0)).toBe('-0');
    expect(p.phpFloatToString(0)).toBe('0');
  });

  test('phpToString keeps strings and converts the rest the PHP way', () => {
    expect(p.phpToString('10.0050')).toBe('10.0050');
    expect(p.phpToString(0.1 + 0.2)).toBe('0.3');
    expect(p.phpToString(null)).toBe('');
    expect(p.phpToString(undefined)).toBe('');
    expect(p.phpToString(false)).toBe('');
    expect(p.phpToString(true)).toBe('1');
    expect(() => p.phpToString({})).toThrow(TypeError);
  });

  test('phpToNumber on non-strings', () => {
    expect(p.phpToNumber(4.5)).toBe(4.5);
    expect(p.phpToNumber(null)).toBe(0);
    expect(p.phpToNumber(undefined)).toBe(0);
    expect(p.phpToNumber(false)).toBe(0);
    expect(p.phpToNumber(true)).toBe(1);
  });

  test('phpRound pre-rounding and large values', () => {
    expect(p.phpRound(1.955, 2)).toBe(1.96);
    expect(p.phpRound(5.055, 2)).toBe(5.06);
    expect(p.phpRound(-2.5, 0)).toBe(-3);
    expect(p.phpRound(0, 2)).toBe(0);
    expect(p.phpRound(Infinity, 2)).toBe(Infinity);
    expect(p.phpRound(1e20, 2)).toBe(1e20);
    expect(p.phpRound(1234.5678, -2)).toBe(1200);
  });

  test('phpNumberFormat of non-finite values', () => {
    expect(p.phpNumberFormat(Infinity, 2)).toBe('inf');
    expect(p.phpNumberFormat(-Infinity, 2)).toBe('-inf');
    expect(p.phpNumberFormat(NaN, 2)).toBe('nan');
  });
});
