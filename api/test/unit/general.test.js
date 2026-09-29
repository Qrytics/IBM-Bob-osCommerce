'use strict';

/**
 * Unit tests for general.js — BR-01, Q-01, Q-02.
 * Expected values quoted from fixtures/golden/functions/tep_round.json.
 * Numeric comparisons use phpFloatToString (precision-14) to replicate the
 * way the legacy PHP code prints float values, matching the fixture strings.
 */

const { tepRound, tepNotNull, tepGetUprid } = require('../../src/domain/general');
const { phpFloatToString, phpToNumber } = require('../../src/domain/phpNumber');

// Converts a tepRound return value the same way the equivalence tests do:
// phpFloatToString(phpToNumber(v)) — reproduces PHP "(string)(float)$v" semantics.
function phpStr(v) {
  return phpFloatToString(phpToNumber(v));
}

// ── BR-01: tepRound works on the string form of the number ──────────────────

describe('tepRound', () => {
  test('BR-01 rounds 1.005 to 2 decimal places → 1.01 (fixture tep_round.json args[1.005,2])', () => {
    // fixture: args [1.005, 2], expected "1.01"
    expect(phpStr(tepRound(1.005, 2))).toBe('1.01');
  });

  test('BR-01 rounds 2.675 to 2 decimal places → 2.68 (fixture tep_round.json args[2.675,2])', () => {
    // fixture: args [2.675, 2], expected "2.68"
    // tepRound returns 2.6799999999999997 (float); phpFloatToString → "2.68"
    expect(phpStr(tepRound(2.675, 2))).toBe('2.68');
  });

  test('BR-01 rounds 1.45 to 1 decimal place → 1.5 (fixture tep_round.json args[1.45,1])', () => {
    // fixture: args [1.45, 1], expected "1.5"
    expect(phpStr(tepRound(1.45, 1))).toBe('1.5');
  });

  test('BR-01 rounds 2.5 to 0 decimal places → 3 (fixture tep_round.json args[2.5,0])', () => {
    // fixture: args [2.5, 0], expected "3"
    expect(phpStr(tepRound(2.5, 0))).toBe('3');
  });

  test('BR-01 string input "10.0050" rounds to 10.01 at precision 2 (fixture tep_round.json args["10.0050",2])', () => {
    // fixture: args ["10.0050", 2], expected "10.01"
    expect(phpStr(tepRound('10.0050', 2))).toBe('10.01');
  });

  test('BR-01 string "19.9950" rounds to 20 (fixture tep_round.json args["19.9950",2])', () => {
    // fixture: args ["19.9950", 2], expected "20"
    expect(phpStr(tepRound('19.9950', 2))).toBe('20');
  });

  test('BR-01 number without dot is returned unchanged — integer 5 at precision 2 (fixture tep_round.json args[5,2])', () => {
    // fixture: args [5, 2], expected "5"
    expect(phpStr(tepRound(5, 2))).toBe('5');
  });

  test('BR-01 rounds 1.994999 down at precision 2 → 1.99 (fixture tep_round.json args[1.994999,2])', () => {
    // fixture: args [1.994999, 2], expected "1.99"
    expect(phpStr(tepRound(1.994999, 2))).toBe('1.99');
  });

  test('BR-01 rounds -1.005 to precision 2 → -0.99 (Q-02, fixture tep_round.json args[-1.005,2])', () => {
    // fixture: args [-1.005, 2], expected "-0.99" (Q-02 negative rounding quirk)
    expect(phpStr(tepRound(-1.005, 2))).toBe('-0.99');
  });

  test('Q-02 rounds -2.675 to precision 2 → -2.66 (fixture tep_round.json args[-2.675,2])', () => {
    // fixture: args [-2.675, 2], expected "-2.66"
    expect(phpStr(tepRound(-2.675, 2))).toBe('-2.66');
  });

  test('Q-01 exponent-form input 0.00001 at precision 2 returns "1" (fixture tep_round.json args[0.00001,2])', () => {
    // fixture: args [0.00001, 2], expected "1"
    // PHP prints 0.00001 as "1.0E-5"; parsing quirk → truncated string "1.0E" → phpToNumber("1.0E")=1
    expect(phpStr(tepRound(0.00001, 2))).toBe('1');
  });

  test('Q-01 exponent-form input 0.00001 at precision 4 is returned as-is (fixture tep_round.json args[0.00001,4])', () => {
    // fixture: args [0.00001, 4], expected "1.0E-5"
    // When precision == digits-after-dot: block is skipped; returns original float 0.00001
    // phpFloatToString(0.00001) = "1.0E-5"
    expect(phpStr(tepRound(0.00001, 4))).toBe('1.0E-5');
  });

  test('BR-01 zero at any precision is returned unchanged (fixture tep_round.json args[0,2])', () => {
    // fixture: args [0, 2], expected "0"
    expect(phpStr(tepRound(0, 2))).toBe('0');
  });
});

// ── tepNotNull ───────────────────────────────────────────────────────────────

describe('tepNotNull', () => {
  test('BR-28 empty string is considered null (tep_not_null returns false)', () => {
    expect(tepNotNull('')).toBe(false);
  });

  test('BR-28 non-empty string "hello" is not null', () => {
    expect(tepNotNull('hello')).toBe(true);
  });

  test('BR-28 integer 0 is considered null (PHP: 0 != "" is false)', () => {
    expect(tepNotNull(0)).toBe(false);
  });

  test('BR-28 the string "null" (case-insensitive) is considered null', () => {
    expect(tepNotNull('null')).toBe(false);
    expect(tepNotNull('NULL')).toBe(false);
  });

  test('BR-28 null is considered null', () => {
    expect(tepNotNull(null)).toBe(false);
  });

  test('BR-28 non-empty array passes', () => {
    expect(tepNotNull([1])).toBe(true);
  });

  test('BR-28 empty array is considered null', () => {
    expect(tepNotNull([])).toBe(false);
  });

  test('BR-28 a price string like "$5.00" passes', () => {
    expect(tepNotNull('$5.00')).toBe(true);
  });

  test('BR-28 a blank / whitespace-only string is considered null', () => {
    expect(tepNotNull('   ')).toBe(false);
  });
});

// ── tepGetUprid ──────────────────────────────────────────────────────────────

describe('tepGetUprid', () => {
  test('BR-09 product with no attributes returns plain product id string', () => {
    expect(tepGetUprid(1, [])).toBe('1');
  });

  test('BR-09 product with attributes returns "prid{opt}val..." string', () => {
    // fixture: us-fl-basic-flat.json product id "1{4}2{3}6"
    expect(tepGetUprid(1, [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }])).toBe('1{4}2{3}6');
  });

  test('BR-09 non-numeric attribute causes the suffix to be dropped', () => {
    // invalid attributes: check = false → no suffix appended
    expect(tepGetUprid(1, [{ optionId: 'abc', valueId: 2 }])).toBe('1');
  });

  test('BR-09 numeric string attributes are accepted as-is (string option/value path at line 151)', () => {
    // covers the string-is-numeric branch in the is_numeric check
    expect(tepGetUprid(1, [{ optionId: '4', valueId: '2' }])).toBe('1{4}2');
  });
});
