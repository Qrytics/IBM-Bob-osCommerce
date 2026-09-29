'use strict';

/**
 * Unit tests for currency.js — BR-07, BR-08 (plus Q-03, Q-10).
 * Expected values quoted from fixtures/golden/functions/calculate_price.json
 * and fixtures/golden/functions/format.json.
 */

const catalog = require('../../../fixtures/catalog.json');
const { calculatePrice, format } = require('../../src/domain/currency');

// Helper: find a currency row by code
function getCurrency(code) {
  return catalog.currencies.find((c) => c.code === code);
}

// ── BR-07: unit price is rounded before multiplying by quantity ───────────────

describe('calculatePrice', () => {
  test('BR-07 Q-03 "10.0050" qty 2 JPY (0 decimals) rounds per unit first: 10 × 2 = 20 (fixture calculate_price.json args["10.0050",20,2,"JPY"])', () => {
    // fixture: displayPriceWithTax false, args ["10.0050", 20, 2, "JPY"], expected "20"
    // Note: taxRate=20 but displayPriceWithTax=false so addTax returns price unchanged
    // tepRound("10.0050", 0) = 10 (rounds down from 10.005), then 10 * 2 = 20
    const ctx = { currency: getCurrency('JPY'), displayPriceWithTax: false };
    expect(calculatePrice('10.0050', 20, 2, ctx)).toBe(20);
  });

  test('BR-07 Q-03 "817.3563" qty 100 JPY exclusive → tepRound(817, 0) × 100 = 81700 (fixture calculate_price.json args["817.3563",13,100,"JPY"])', () => {
    // fixture: displayPriceWithTax false, args ["817.3563", 13, 100, "JPY"], expected "81700"
    const ctx = { currency: getCurrency('JPY'), displayPriceWithTax: false };
    expect(calculatePrice('817.3563', 13, 100, ctx)).toBe(81700);
  });

  test('BR-07 USD price with tax false, qty 7: rounds per unit before multiply (fixture calculate_price.json args["635.8982",7.0000001,7,"USD"])', () => {
    // fixture: displayPriceWithTax false, args ["635.8982", 7.0000001, 7, "USD"], expected "4451.3"
    const ctx = { currency: getCurrency('USD'), displayPriceWithTax: false };
    expect(calculatePrice('635.8982', 7.0000001, 7, ctx)).toBe(4451.3);
  });

  test('BR-07 EUR price qty 7 rounds per unit: "1.3333" × 5% tax false → 9.31 (fixture calculate_price.json args["1.3333",5,7,"EUR"])', () => {
    // fixture: displayPriceWithTax false, args ["1.3333", 5, 7, "EUR"], expected "9.31"
    const ctx = { currency: getCurrency('EUR'), displayPriceWithTax: false };
    expect(calculatePrice('1.3333', 5, 7, ctx)).toBe(9.31);
  });

  test('BR-07 Q-10 JPY display rounds USD price BEFORE multiplying by quantity (fixture calculate_price.json args["863.9107",19,2,"JPY"])', () => {
    // fixture: displayPriceWithTax false, args ["863.9107", 19, 2, "JPY"], expected "1728"
    // tepRound(863.9107, 0) = 864, 864 * 2 = 1728
    const ctx = { currency: getCurrency('JPY'), displayPriceWithTax: false };
    expect(calculatePrice('863.9107', 19, 2, ctx)).toBe(1728);
  });

  test('BR-07 displayPriceWithTax=true adds tax before rounding: 100 × 7% → tepRound(107, 2) × 1 = 107', () => {
    const ctx = { currency: getCurrency('USD'), displayPriceWithTax: true };
    expect(calculatePrice(100, 7, 1, ctx)).toBe(107);
  });

  test('BR-07 zero price returns 0', () => {
    const ctx = { currency: getCurrency('USD'), displayPriceWithTax: false };
    expect(calculatePrice(0, 7, 5, ctx)).toBe(0);
  });
});

// ── BR-08: format() applies exchange rate, rounding, and separators ──────────

describe('format', () => {
  test('BR-08 zero USD with rate applied → "$0.00" (fixture format.json args[0,"USD",true,null])', () => {
    // fixture: args [0, "USD", true, null], expected "$0.00"
    expect(format(0, getCurrency('USD'), true, null)).toBe('$0.00');
  });

  test('BR-08 zero EUR → "0,00€" (fixture format.json args[0,"EUR",true,null])', () => {
    // fixture: args [0, "EUR", true, null], expected "0,00€"
    expect(format(0, getCurrency('EUR'), true, null)).toBe('0,00€');
  });

  test('BR-08 zero JPY → "¥0" (fixture format.json args[0,"JPY",true,null])', () => {
    // fixture: args [0, "JPY", true, null], expected "¥0"
    expect(format(0, getCurrency('JPY'), true, null)).toBe('¥0');
  });

  test('BR-08 $1.00 USD no rate applied (fixture format.json args[1,"USD",false,null])', () => {
    // fixture: args [1, "USD", false, null], expected "$1.00"
    expect(format(1, getCurrency('USD'), false, null)).toBe('$1.00');
  });

  test('BR-08 rate override: 1 USD × 1.2345 = 1.23 (fixture format.json args[1,"USD",true,"1.2345"])', () => {
    // fixture: args [1, "USD", true, "1.2345"], expected "$1.23"
    expect(format(1, getCurrency('USD'), true, '1.2345')).toBe('$1.23');
  });

  test('BR-08 zero EUR with rate override "1.2345" still → "0,00€" (fixture format.json args[0,"EUR",true,"1.2345"])', () => {
    // fixture: args [0, "EUR", true, "1.2345"], expected "0,00€"
    expect(format(0, getCurrency('EUR'), true, '1.2345')).toBe('0,00€');
  });

  test('BR-26 thousands separator: $187,497.50 for large USD value (fixture us-fl-thousands-separator.json ot_subtotal.text)', () => {
    // fixture us-fl-thousands-separator.json: subtotal 187497.5 → "$187,497.50"
    expect(format(187497.5, getCurrency('USD'), false, null)).toBe('$187,497.50');
  });

  test('BR-08 EUR symbol on right, comma decimal: 183,09€ (fixture de-mixed-classes-eur.json ot_subtotal.text)', () => {
    // fixture de-mixed-classes-eur.json: ot_subtotal.text = "183,09€" (subtotal 206.41 × 0.887 = 183.08...)
    // exact: format(206.41, EUR, true, "0.887") → tepRound(206.41 × 0.887, 2) = 183.08... hmm
    // The fixture shows "183,09€"; let's check: 206.41 × 0.887 = 183.08567 → tepRound → 183.09?
    // Actually format called with value=206.41, applyRate=true, rateOverride="0.887"
    // 206.41 * 0.887 = 183.08567 → tepRound to 2 decimals: "183.09"
    expect(format(206.41, getCurrency('EUR'), true, '0.887')).toBe('183,09€');
  });

  test('BR-08 applyRate=false bypasses exchange rate multiplication', () => {
    // format(50, USD, false, null) → tepRound(50, 2) = 50 → "$50.00"
    expect(format(50, getCurrency('USD'), false, null)).toBe('$50.00');
  });

  test('BR-08 default applyRate (true) and default rateOverride (null) — covers default parameter branches', () => {
    // Call with only 2 args to exercise both default parameter branches
    expect(format(1, getCurrency('USD'))).toBe('$1.00');
  });
});
