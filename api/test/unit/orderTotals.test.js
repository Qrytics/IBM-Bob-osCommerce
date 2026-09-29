'use strict';

/**
 * Unit tests for orderTotals/ — BR-24, BR-25, BR-26, BR-27, BR-28 (plus Q-07, Q-09).
 * Expected values from fixtures/golden/scenarios/.
 *
 * Tests cover: subtotal.js, total.js, tax.js, shipping.js, index.js
 */

const catalog = require('../../../fixtures/catalog.json');
const subtotalModule = require('../../src/domain/orderTotals/subtotal');
const totalModule = require('../../src/domain/orderTotals/total');
const taxModule = require('../../src/domain/orderTotals/tax');
const shippingModule = require('../../src/domain/orderTotals/shipping');
const { processAll } = require('../../src/domain/orderTotals/index');

const usdCurrency = catalog.currencies.find((c) => c.code === 'USD');
const eurCurrency = catalog.currencies.find((c) => c.code === 'EUR');

// Default free-shipping settings (disabled)
const noFreeShipping = { enabled: false, over: '500', destination: 'national' };

// ── BR-26: subtotal line ──────────────────────────────────────────────────────

describe('ot_subtotal.process', () => {
  test('BR-26 formats order.info.subtotal → Sub-Total: with currency (fixture us-fl-basic-flat.json ot_subtotal)', () => {
    // fixture: title "Sub-Total:", text "$939.97", value "939.97"
    const order = {
      info: {
        subtotal: 939.97,
        currencyValue: '1',
        currency: 'USD',
      },
    };
    const ctx = { currency: usdCurrency };
    const output = subtotalModule.process(order, ctx);
    expect(output).toHaveLength(1);
    expect(output[0].title).toBe('Sub-Total:');
    expect(output[0].text).toBe('$939.97');
    expect(output[0].value).toBe(939.97);
  });

  test('BR-26 subtotal = 0 (empty cart) still emits a line (fixture us-fl-empty-cart.json ot_subtotal)', () => {
    // fixture: text "$0.00"
    const order = { info: { subtotal: 0, currencyValue: '1', currency: 'USD' } };
    const ctx = { currency: usdCurrency };
    const output = subtotalModule.process(order, ctx);
    expect(output[0].text).toBe('$0.00');
  });

  test('BR-26 thousands separator in subtotal text (fixture us-fl-thousands-separator.json ot_subtotal)', () => {
    // fixture: text "$187,497.50"
    const order = { info: { subtotal: 187497.5, currencyValue: '1', currency: 'USD' } };
    const ctx = { currency: usdCurrency };
    const output = subtotalModule.process(order, ctx);
    expect(output[0].text).toBe('$187,497.50');
  });
});

// ── BR-26: total line ─────────────────────────────────────────────────────────

describe('ot_total.process', () => {
  test('BR-26 formats order.info.total wrapped in <strong> (fixture us-fl-basic-flat.json ot_total)', () => {
    // fixture: text "<strong>$1,010.77</strong>", value "1010.7679"
    const order = { info: { total: 1010.7679, currencyValue: '1', currency: 'USD' } };
    const ctx = { currency: usdCurrency };
    const output = totalModule.process(order, ctx);
    expect(output[0].title).toBe('Total:');
    expect(output[0].text).toBe('<strong>$1,010.77</strong>');
    expect(output[0].value).toBe(1010.7679);
  });

  test('BR-26 EUR currency with rate applied (fixture de-mixed-classes-eur.json ot_total)', () => {
    // fixture: ot_total.text "<strong>187,43€</strong>", value "211.31"
    const order = { info: { total: 211.31, currencyValue: '0.887', currency: 'EUR' } };
    const ctx = { currency: eurCurrency };
    const output = totalModule.process(order, ctx);
    expect(output[0].text).toBe('<strong>187,43€</strong>');
  });
});

// ── BR-27: one tax line per non-zero tax group ────────────────────────────────

describe('ot_tax.process', () => {
  test('BR-27 emits one line per group with amount > 0 (fixture us-fl-basic-flat.json ot_tax)', () => {
    // fixture: ot_tax title "FL TAX 7.0%:", text "$65.80", value "65.7979"
    const order = {
      info: {
        taxGroups: [{ description: 'FL TAX 7.0%', amount: 65.7979 }],
        currencyValue: '1',
        currency: 'USD',
      },
    };
    const ctx = { currency: usdCurrency };
    const output = taxModule.process(order, ctx);
    expect(output).toHaveLength(1);
    expect(output[0].title).toBe('FL TAX 7.0%:');
    expect(output[0].text).toBe('$65.80');
    expect(output[0].value).toBe(65.7979);
  });

  test('Q-09 BR-27 "Unknown tax rate" group with amount 0 is NOT emitted (fixture us-fl-untaxed-product.json ot_tax)', () => {
    // fixture: only FL TAX 7.0% appears in ot_tax, not "Unknown tax rate"
    const order = {
      info: {
        taxGroups: [
          { description: 'Unknown tax rate', amount: 0 },
          { description: 'FL TAX 7.0%', amount: 2.7993 },
        ],
        currencyValue: '1',
        currency: 'USD',
      },
    };
    const ctx = { currency: usdCurrency };
    const output = taxModule.process(order, ctx);
    expect(output).toHaveLength(1);
    expect(output[0].title).toBe('FL TAX 7.0%:');
  });

  test('BR-27 two non-zero groups → two lines (fixture de-mixed-classes-eur.json ot_tax)', () => {
    // fixture: two ot_tax lines: MwSt 19% and MwSt 7%
    const order = {
      info: {
        taxGroups: [
          { description: 'MwSt 19%', amount: 13.480420168067 },
          { description: 'MwSt 7%', amount: 7.98 },
        ],
        currencyValue: '0.887',
        currency: 'EUR',
      },
    };
    const ctx = { currency: eurCurrency };
    const output = taxModule.process(order, ctx);
    expect(output).toHaveLength(2);
    expect(output[0].title).toBe('MwSt 19%:');
    expect(output[1].title).toBe('MwSt 7%:');
  });

  test('BR-28 empty taxGroups → no tax lines (fixture us-fl-empty-cart.json orderTotals)', () => {
    // fixture: no ot_tax in us-fl-empty-cart.json orderTotals
    const order = { info: { taxGroups: [], currencyValue: '1', currency: 'USD' } };
    const ctx = { currency: usdCurrency };
    const output = taxModule.process(order, ctx);
    expect(output).toHaveLength(0);
  });
});

// ── BR-24 & BR-25: ot_shipping.process ───────────────────────────────────────

describe('ot_shipping.process', () => {
  function makeOrder(overrides = {}) {
    return {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5,
        subtotal: 939.97,
        tax: 65.7979,
        taxGroups: [{ description: 'FL TAX 7.0%', amount: 65.7979 }],
        total: 1010.7679,
        ...overrides,
      },
    };
  }

  test('BR-26 shipping line emits shippingMethod as title (fixture us-fl-basic-flat.json ot_shipping)', () => {
    // fixture: title "Flat Rate (Best Way):", text "$5.00", value "5"
    const order = makeOrder();
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    const output = shippingModule.process(order, ctx);
    expect(output[0].title).toBe('Flat Rate (Best Way):');
    expect(output[0].text).toBe('$5.00');
    expect(output[0].value).toBe(5);
  });

  test('BR-25 shipping tax added to order.info.tax, taxGroups, and total (fixture us-fl-taxed-shipping.json orderAfterTotals)', () => {
    // fixture: tax 65.7979+0.6993=66.4972, total 1015.7579+0.6993=1016.4572
    const order = makeOrder({
      shippingCost: 9.99,
      tax: 65.7979,
      taxGroups: [{ description: 'FL TAX 7.0%', amount: 65.7979 }],
      total: 1015.7579,
    });
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 3 }, // tax class 3 → FL 7%
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    // 9.99 × 7% = 0.6993
    expect(order.info.tax).toBeCloseTo(66.4972, 4);
    expect(order.info.total).toBeCloseTo(1016.4572, 4);
    expect(order.info.taxGroups[0].amount).toBeCloseTo(66.4972, 4);
  });

  test('BR-25 inclusive pricing: shipping cost itself is increased by tax (fixture us-fl-taxed-shipping-inclusive.json orderAfterTotals)', () => {
    // fixture: shippingCost "10.6893"
    const order = makeOrder({
      shippingCost: 9.99,
      tax: 65.798037383178,
      taxGroups: [{ description: 'FL TAX 7.0%', amount: 65.798037383178 }],
      total: 1015.76,
    });
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 3 },
      catalog,
      displayPriceWithTax: true,
    };
    shippingModule.process(order, ctx);
    // fixture: shippingCost "10.6893"
    expect(order.info.shippingCost).toBeCloseTo(10.6893, 4);
  });

  test('BR-24 free shipping re-check zeros out shipping cost (fixture ca-free-shipping-international.json orderAfterTotals)', () => {
    // fixture: shippingCost "0", shippingMethod "Free Shipping", total = subtotal+tax (exclusive)
    // Delivery is Canada (country 38), destination=international, total-shippingCost >= 50
    const order = {
      delivery: { countryId: 38, zoneId: 74 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5,
        subtotal: 939.97,
        tax: 122.1961,
        taxGroups: [{ description: 'HST 13%', amount: 122.1961 }],
        total: 1067.1661,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: { enabled: true, over: '50', destination: 'international' },
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    // fixture: shippingCost "0", shippingMethod "Free Shipping"
    expect(order.info.shippingCost).toBe(0);
    expect(order.info.shippingMethod).toBe('Free Shipping');
    expect(order.info.total).toBeCloseTo(1062.1661, 4);
  });

  test('BR-24 Q-07 free shipping re-check uses (total - shippingCost) not total (fixture ca-free-shipping-international.json)', () => {
    // The threshold check is (total - shippingCost) >= over, not total >= over
    // So shipping is NOT counted in the comparison amount for ot_shipping
    const order = {
      delivery: { countryId: 38, zoneId: 74 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5,
        subtotal: 10,
        tax: 1,
        taxGroups: [],
        total: 16,
        // total - shippingCost = 11 which is < 20 threshold → no free shipping
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: { enabled: true, over: '20', destination: 'both' },
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    // (16 - 5) = 11 < 20 → NOT free
    expect(order.info.shippingCost).toBe(5);
    expect(order.info.shippingMethod).toBe('Flat Rate (Best Way)');
  });

  test('BR-25 new tax group created when shipping tax description not in existing groups', () => {
    // shipping has taxClass 3 → "FL TAX 7.0%" but taxGroups is empty → creates new group
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 10,
        subtotal: 0,
        tax: 0,
        taxGroups: [],
        total: 10,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 3 },
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    expect(order.info.taxGroups).toHaveLength(1);
    expect(order.info.taxGroups[0].description).toBe('FL TAX 7.0%');
  });

  test('BR-28 empty shippingMethod → no output lines emitted', () => {
    // When shippingMethod fails tepNotNull (e.g. empty string), process returns []
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: '',
        shippingCost: 0,
        subtotal: 0,
        tax: 0,
        taxGroups: [],
        total: 0,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: null,
      installedShippingTaxClasses: {},
      catalog,
      displayPriceWithTax: false,
    };
    const output = shippingModule.process(order, ctx);
    expect(output).toHaveLength(0);
  });

  test('BR-24 free shipping national destination: US order qualifies', () => {
    // US delivery (same as store) → national match
    const order = makeOrder({ total: 600, shippingCost: 5 });
    const ctx = {
      currency: usdCurrency,
      freeShipping: { enabled: true, over: '50', destination: 'national' },
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    expect(order.info.shippingCost).toBe(0);
  });

  test('BR-24 free shipping "both" destination: any country qualifies', () => {
    const order = {
      delivery: { countryId: 38, zoneId: 74 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5,
        subtotal: 200,
        tax: 0,
        taxGroups: [],
        total: 205,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: { enabled: true, over: '50', destination: 'both' },
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    expect(order.info.shippingCost).toBe(0);
  });

  test('BR-24 free shipping "unknown" destination: does not qualify', () => {
    const order = makeOrder({ total: 600, shippingCost: 5 });
    const ctx = {
      currency: usdCurrency,
      freeShipping: { enabled: true, over: '50', destination: 'unknown_dest' },
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    shippingModule.process(order, ctx);
    // pass=false for unknown destination → shipping not zeroed
    expect(order.info.shippingCost).toBe(5);
  });

  test('BR-24 international destination but delivery same country as store → NOT free (shipping.js line 65 false branch)', () => {
    // destination=international, but delivery is same country as store (223) → deliveryCountryId === storeCountryId → pass stays false
    const order = makeOrder({ total: 600, shippingCost: 5 });
    const ctx = {
      currency: usdCurrency,
      freeShipping: { enabled: true, over: '50', destination: 'international' },
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    // order has delivery countryId 223 (same as storeCountryId)
    shippingModule.process(order, ctx);
    expect(order.info.shippingCost).toBe(5); // not free
  });
});

// ── BR-28: processAll drives all modules, drops empty lines ──────────────────

describe('processAll', () => {
  test('BR-28 empty cart: ot_tax absent (no tax groups), 3 lines total (fixture us-fl-empty-cart.json orderTotals)', () => {
    // fixture: [ot_subtotal, ot_shipping, ot_total] — ot_tax is absent
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5,
        subtotal: 0,
        tax: 0,
        taxGroups: [],
        total: 5,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    const totals = processAll(order, ctx);
    expect(totals).toHaveLength(3);
    const codes = totals.map((t) => t.code);
    expect(codes).toContain('ot_subtotal');
    expect(codes).toContain('ot_shipping');
    expect(codes).toContain('ot_total');
    expect(codes).not.toContain('ot_tax');
  });

  test('BR-28 full order produces ot_subtotal, ot_shipping, ot_tax, ot_total (fixture us-fl-basic-flat.json orderTotals)', () => {
    // fixture: 4 lines in orderTotals
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5,
        subtotal: 939.97,
        tax: 65.7979,
        taxGroups: [{ description: 'FL TAX 7.0%', amount: 65.7979 }],
        total: 1010.7679,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    const totals = processAll(order, ctx);
    expect(totals).toHaveLength(4);
    expect(totals[0].code).toBe('ot_subtotal');
    expect(totals[1].code).toBe('ot_shipping');
    expect(totals[2].code).toBe('ot_tax');
    expect(totals[3].code).toBe('ot_total');
    // sortOrder is set from ORDER_TOTAL_MODULES
    expect(totals[0].sortOrder).toBe(1);
    expect(totals[3].sortOrder).toBe(4);
  });

  test('BR-28 processAll passes sortOrder from ORDER_TOTAL_MODULES config', () => {
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD', currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5, subtotal: 100, tax: 7,
        taxGroups: [{ description: 'FL TAX 7.0%', amount: 7 }],
        total: 112,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: {},
      catalog,
      displayPriceWithTax: false,
    };
    const totals = processAll(order, ctx);
    // all codes present, sortOrders match expected
    const byCode = Object.fromEntries(totals.map((t) => [t.code, t]));
    expect(byCode.ot_subtotal.sortOrder).toBe(1);
    expect(byCode.ot_tax.sortOrder).toBe(3);
    expect(byCode.ot_total.sortOrder).toBe(4);
  });

  test('BR-26 BR-28 ot_total text is wrapped in <strong> (fixture us-fl-basic-flat.json ot_total.text)', () => {
    // fixture: "<strong>$1,010.77</strong>"
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD', currencyValue: '1',
        shippingMethod: 'Flat Rate (Best Way)',
        shippingCost: 5, subtotal: 939.97, tax: 65.7979,
        taxGroups: [{ description: 'FL TAX 7.0%', amount: 65.7979 }],
        total: 1010.7679,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: { id: 'flat_flat' },
      installedShippingTaxClasses: { flat: 0 },
      catalog,
      displayPriceWithTax: false,
    };
    const totals = processAll(order, ctx);
    const otTotal = totals.find((t) => t.code === 'ot_total');
    expect(otTotal.text).toBe('<strong>$1,010.77</strong>');
  });

  test('BR-28 lines with empty shippingMethod → ot_shipping not emitted, only subtotal and total (orderTotals/index.js lines 42-48)', () => {
    // Covers the tepNotNull false branch (output line filtered out) when ot_shipping returns []
    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD',
        currencyValue: '1',
        shippingMethod: '',  // tepNotNull('') = false → ot_shipping returns []
        shippingCost: 0,
        subtotal: 100,
        tax: 7,
        taxGroups: [{ description: 'FL TAX 7.0%', amount: 7 }],
        total: 107,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: null,
      installedShippingTaxClasses: {},
      catalog,
      displayPriceWithTax: false,
    };
    const totals = processAll(order, ctx);
    const codes = totals.map((t) => t.code);
    expect(codes).not.toContain('ot_shipping');
    expect(codes).toContain('ot_subtotal');
    expect(codes).toContain('ot_total');
  });

});

// ── orderTotals/index.js defensive branch: unknown module code ────────────────

describe('processAll — defensive branches (orderTotals/index.js lines 42, 48)', () => {
  test('BR-28 unknown module code is skipped AND empty-titled line is filtered (covers if(!m) and tepNotNull false)', () => {
    // Two branches in one isolated test:
    // 1. !m → continue (line 42): an ot_fake_module code not in MODULES map
    // 2. tepNotNull(title) false (line 48): a module that emits an empty-titled line
    let processAllWithMocks;
    jest.isolateModules(() => {
      jest.mock('../../src/domain/constants', () => ({
        ...jest.requireActual('../../src/domain/constants'),
        ORDER_TOTAL_MODULES: Object.freeze([
          Object.freeze({ code: 'ot_unknown_xyz', sortOrder: 0 }), // !m = true → continue
          Object.freeze({ code: 'ot_subtotal', sortOrder: 1 }),
          Object.freeze({ code: 'ot_total', sortOrder: 4 }),
        ]),
      }));
      // Also mock ot_subtotal to emit one empty-titled line (to cover tepNotNull false branch)
      jest.mock('../../src/domain/orderTotals/subtotal', () => ({
        process: () => [
          { title: '', text: 'filtered', value: 0 },   // tepNotNull('') = false → filtered out
          { title: 'Sub-Total:', text: '$0.00', value: 0 }, // passes
        ],
      }));
      processAllWithMocks = require('../../src/domain/orderTotals/index').processAll;
    });

    const order = {
      delivery: { countryId: 223, zoneId: 18 },
      info: {
        currency: 'USD', currencyValue: '1',
        shippingMethod: '', shippingCost: 0,
        subtotal: 0, tax: 0, taxGroups: [], total: 0,
      },
    };
    const ctx = {
      currency: usdCurrency,
      freeShipping: noFreeShipping,
      storeCountryId: 223,
      selectedShipping: null,
      installedShippingTaxClasses: {},
      catalog,
      displayPriceWithTax: false,
    };
    const totals = processAllWithMocks(order, ctx);
    // ot_unknown_xyz is skipped (line 42 true branch)
    // empty-titled line is filtered (line 48 false branch)
    // Sub-Total: and Total: lines pass
    const codes = totals.map((t) => t.code);
    expect(codes).not.toContain('ot_unknown_xyz');
    expect(totals).toHaveLength(2); // Sub-Total: and Total: only
  });
});
