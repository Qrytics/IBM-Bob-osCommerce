'use strict';

/**
 * Unit tests for tax.js — BR-02, BR-03, BR-04, BR-05, BR-06, BR-16 (plus Q-06, Q-09).
 * Expected values quoted from fixtures/golden/functions/ and scenarios/.
 */

const catalog = require('../../../fixtures/catalog.json');
const { getTaxRate, getTaxDescription, addTax, calculateTax, inclusiveTaxPortion } = require('../../src/domain/tax');

// Mini-catalog with a tax_rate that has NO zones_to_geo_zones rows at all
// (simulates the LEFT JOIN NULL case: rate matches every location)
const catalogWithOrphanRate = {
  ...catalog,
  tax_rates: [
    // rate with tax_zone_id 999 which has no association rows → matches everywhere
    { tax_rates_id: 99, tax_zone_id: 999, tax_class_id: 77, tax_priority: 1, tax_rate: '15.0000', tax_description: 'Orphan Tax 15%' },
  ],
  zones_to_geo_zones: catalog.zones_to_geo_zones, // no rows for zone 999
};

// ── BR-02: which tax rates apply to a location ───────────────────────────────

const { phpFloatToString, phpToNumber } = require('../../src/domain/phpNumber');

// Normalise a tax rate the same way the equivalence tests do: PHP precision-14 string form.
function phpStr(v) {
  return phpFloatToString(phpToNumber(v));
}

describe('getTaxRate', () => {
  test('BR-02 Florida (country 223, zone 18) returns 7% for tax class 1 (fixture tax_rate.json args[1,223,18])', () => {
    // fixture: args [1, 223, 18], expected "7"
    expect(phpStr(getTaxRate(catalog, 1, 223, 18))).toBe('7');
  });

  test('BR-02 unknown zone (country 223, zone 12) returns 0 when no rows match (fixture tax_rate.json args[1,223,12])', () => {
    // fixture: args [1, 223, 12], expected "0"
    expect(getTaxRate(catalog, 1, 223, 12)).toBe(0);
  });

  test('BR-02 tax class 0 always returns 0 regardless of location (fixture tax_rate.json args[0,223,18])', () => {
    // fixture: args [0, 223, 18], expected "0"
    expect(getTaxRate(catalog, 0, 223, 18)).toBe(0);
  });

  test('BR-02 unknown tax class 99 returns 0 (fixture tax_rate.json args[99,223,18])', () => {
    // fixture: args [99, 223, 18], expected "0"
    expect(getTaxRate(catalog, 99, 223, 18)).toBe(0);
  });

  test('BR-02 Ontario (country 38, zone 74) returns 13% HST for tax class 1 (fixture tax_rate.json args[1,38,74])', () => {
    // fixture: args [1, 38, 74], expected "13"
    expect(phpStr(getTaxRate(catalog, 1, 38, 74))).toBe('13');
  });

  test('BR-02 Germany (country 81, zone 81) returns 19% MwSt for tax class 1 (fixture tax_rate.json args[1,81,81])', () => {
    // fixture: args [1, 81, 81], expected "19"
    // zone_id=0 in zones_to_geo_zones means all German zones match
    expect(phpStr(getTaxRate(catalog, 1, 81, 81))).toBe('19');
  });

  test('BR-02 Germany (country 81, zone_id 0 covers all) returns 19% for German zone 79 (fixture tax_rate.json args[1,81,79])', () => {
    // fixture: args [1, 81, 79], expected "19"
    expect(phpStr(getTaxRate(catalog, 1, 81, 79))).toBe('19');
  });

  test('BR-02 New York (country 223, zone 43) returns 8.5% for tax class 1 (fixture tax_rate.json args[1,223,43])', () => {
    // fixture: args [1, 223, 43], expected "8.5" (NY State 4% + NYC 4.5% summed, BR-03)
    expect(phpStr(getTaxRate(catalog, 1, 223, 43))).toBe('8.5');
  });

  // ── BR-03: same-priority rates are summed ────────────────────────────────────

  test('BR-03 Quebec (country 38, zone 76) GST 5% and QST 9.975% are compounded → 15.47375% (fixture tax_rate.json args[1,38,76])', () => {
    // fixture: args [1, 38, 76], expected "15.47375"
    // Compounding: (1.05 × 1.09975 − 1) × 100 = 15.47375
    expect(phpStr(getTaxRate(catalog, 1, 38, 76))).toBe('15.47375');
  });

  test('BR-02 Florida tax class 2 (FL Reduced 2.5%) returns 2.5 for zone 18 (fixture tax_rate.json args[2,223,18])', () => {
    // fixture: args [2, 223, 18], expected "2.5"
    expect(phpStr(getTaxRate(catalog, 2, 223, 18))).toBe('2.5');
  });

  test('BR-02 rate with no zones_to_geo_zones rows matches any location (LEFT JOIN NULL path, tax.js line 54)', () => {
    // Covers the zaRows.length === 0 branch: a tax_rate with no geo-zone associations
    // acts like a global rate (matches everywhere via IS NULL in the SQL WHERE clause)
    expect(phpStr(getTaxRate(catalogWithOrphanRate, 77, 223, 18))).toBe('15');
    expect(phpStr(getTaxRate(catalogWithOrphanRate, 77, 38, 74))).toBe('15');
  });
});

// ── BR-04: tax descriptions are joined in priority order ─────────────────────

describe('getTaxDescription', () => {
  test('BR-04 Florida returns "FL TAX 7.0%" for tax class 1 (fixture tax_description.json args[1,223,18])', () => {
    // fixture: args [1, 223, 18], expected "FL TAX 7.0%"
    expect(getTaxDescription(catalog, 1, 223, 18)).toBe('FL TAX 7.0%');
  });

  test('BR-04 no matching rows returns TEXT_UNKNOWN_TAX_RATE (fixture tax_description.json args[1,223,12])', () => {
    // fixture: args [1, 223, 12], expected "Unknown tax rate"
    expect(getTaxDescription(catalog, 1, 223, 12)).toBe('Unknown tax rate');
  });

  test('BR-04 New York returns "NY State 4% + NYC 4.5%" with " + " separator (fixture tax_description.json args[1,223,43])', () => {
    // fixture: args [1, 223, 43], expected "NY State 4% + NYC 4.5%"
    expect(getTaxDescription(catalog, 1, 223, 43)).toBe('NY State 4% + NYC 4.5%');
  });

  test('BR-04 Quebec returns "GST 5% + QST 9.975%" ordered by priority (fixture tax_description.json args[1,38,76])', () => {
    // fixture: args [1, 38, 76], expected "GST 5% + QST 9.975%"
    expect(getTaxDescription(catalog, 1, 38, 76)).toBe('GST 5% + QST 9.975%');
  });

  test('BR-04 Ontario returns "HST 13%" for tax class 1 (fixture tax_description.json args[1,38,74])', () => {
    // fixture: args [1, 38, 74], expected "HST 13%"
    expect(getTaxDescription(catalog, 1, 38, 74)).toBe('HST 13%');
  });

  test('Q-09 tax class 0 always returns "Unknown tax rate" (fixture tax_description.json args[0,223,18])', () => {
    // fixture: args [0, 223, 18], expected "Unknown tax rate"
    expect(getTaxDescription(catalog, 0, 223, 18)).toBe('Unknown tax rate');
  });

  test('BR-04 Germany returns "MwSt 7%" for tax class 2 zone 79 (fixture tax_description.json args[2,81,79])', () => {
    // fixture: args [2, 81, 79], expected "MwSt 7%"
    expect(getTaxDescription(catalog, 2, 81, 79)).toBe('MwSt 7%');
  });
});

// ── BR-05: addTax passes through when displayPriceWithTax is false ────────────

describe('addTax', () => {
  test('BR-05 displayPriceWithTax=false returns price unchanged (fixture add_tax.json args[831.4381,19] false)', () => {
    // fixture: displayPriceWithTax false, args [831.4381, 19], expected "831.4381"
    expect(String(addTax(831.4381, 19, false))).toBe('831.4381');
  });

  test('BR-05 displayPriceWithTax=false with rate 0 returns price unchanged (fixture add_tax.json args[1.15,0] false)', () => {
    // fixture: displayPriceWithTax false, args [1.15, 0], expected "1.15"
    expect(String(addTax(1.15, 0, false))).toBe('1.15');
  });

  test('BR-05 displayPriceWithTax=true and tax=0 returns price unchanged (addTax does not add 0 tax)', () => {
    // tax=0 → condition taxRate > 0 is false → return price unchanged
    // BR-05: "tax is added only when displayPriceWithTax is true AND tax > 0"
    expect(addTax(100, 0, true)).toBe(100);
  });

  test('BR-05 displayPriceWithTax=true adds tax to price: 100 + 7% = 107', () => {
    // 100 + 100*7/100 = 107
    expect(addTax(100, 7, true)).toBe(107);
  });

  test('BR-06 displayPriceWithTax=true adds calculateTax result: 831.4381 + 157.973239 ≈ 989.411339', () => {
    // Uses calculateTax internally: 831.4381 * 19/100 = 157.973239
    expect(addTax(831.4381, 19, true)).toBeCloseTo(989.411339, 5);
  });
});

// ── BR-06: calculateTax returns price × rate / 100 ───────────────────────────

describe('calculateTax', () => {
  test('BR-06 831.4381 × 19% = 157.973239 (fixture calculate_tax.json args[831.4381,19])', () => {
    // fixture: args [831.4381, 19], expected "157.973239"
    expect(calculateTax(831.4381, 19)).toBe(157.973239);
  });

  test('BR-06 string price "713.9717" × 99.5% (fixture calculate_tax.json args["713.9717",99.5])', () => {
    // fixture: args ["713.9717", 99.5], expected "710.4018415"
    expect(calculateTax('713.9717', 99.5)).toBe(710.4018415);
  });

  test('BR-06 3.6 × 9.975% = 0.3591 (fixture calculate_tax.json args[3.6,9.975])', () => {
    // fixture: args [3.6, 9.975], expected "0.3591"
    expect(calculateTax(3.6, 9.975)).toBe(0.3591);
  });

  test('BR-06 zero price produces zero tax', () => {
    expect(calculateTax(0, 19)).toBe(0);
  });

  test('BR-06 zero rate produces zero tax', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });
});

// ── BR-16: inclusiveTaxPortion — string-concatenation divisor ────────────────

describe('inclusiveTaxPortion', () => {
  test('BR-16 rate=0 produces 0 tax portion (fixture inclusive_tax.json args[100,0])', () => {
    // fixture: args [100, 0], expected "0"
    expect(inclusiveTaxPortion(100, 0)).toBe(0);
  });

  test('BR-16 rate=7: 100 - 100/1.07 = 6.5420560747664 (fixture inclusive_tax.json args[100,7])', () => {
    // fixture: args [100, 7], expected "6.5420560747664"
    // Divisor for rate < 10: "1.0" + "7" = "1.07"
    expect(inclusiveTaxPortion(100, 7)).toBeCloseTo(6.5420560747664, 10);
  });

  test('BR-16 rate=13: 100 - 100/1.13 (fixture inclusive_tax.json args[100,13])', () => {
    // fixture: args [100, 13], expected "11.504424778761"
    // Divisor for rate >= 10: "1." + "13" = "1.13"
    expect(inclusiveTaxPortion(100, 13)).toBeCloseTo(11.504424778761, 8);
  });

  test('BR-16 rate=9.975: divisor "1.09975" (fixture inclusive_tax.json args[100,9.975])', () => {
    // fixture: args [100, 9.975], expected "9.0702432370993"
    // Divisor: rate < 10 → "1.0" + "9975" = "1.09975"
    expect(inclusiveTaxPortion(100, 9.975)).toBeCloseTo(9.0702432370993, 8);
  });

  test('Q-06 rate=100 uses wrong divisor "1.100" not 2.0 (fixture inclusive_tax.json: rate 100 produces ~9.09)', () => {
    // Q-06: str_replace('.','','100') = "100", rate>=10 → divisor = "1."+"100" = "1.100"
    // 100 - 100/1.1 = 9.0909...
    // No fixture for rate=100 directly, but the quirk produces ~9.09 not 50
    expect(inclusiveTaxPortion(100, 100)).toBeCloseTo(9.0909090909091, 8);
  });

  test('BR-16 rate=2.5: divisor "1.025" backs out tax from 100 (fixture inclusive_tax.json args[100,2.5])', () => {
    // fixture: args [100, 2.5], expected "2.4390243902439"
    expect(inclusiveTaxPortion(100, 2.5)).toBeCloseTo(2.4390243902439, 8);
  });
});
