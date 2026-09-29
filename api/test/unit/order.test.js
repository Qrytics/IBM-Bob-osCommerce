'use strict';

/**
 * Unit tests for order.js — BR-13, BR-14, BR-15, BR-16, BR-17 (plus Q-04, Q-06, Q-09).
 * Expected values from fixtures/golden/scenarios/.
 */

const { phpFloatToString, phpToNumber } = require('../../src/domain/phpNumber');
// Normalise via PHP precision-14 string form (same as equivalence tests).
function phpStr(v) { return phpFloatToString(phpToNumber(v)); }

const catalog = require('../../../fixtures/catalog.json');
const { buildOrder } = require('../../src/domain/order');

const usdCurrency = catalog.currencies.find((c) => c.code === 'USD');
const eurCurrency = catalog.currencies.find((c) => c.code === 'EUR');

// Florida delivery
const flDelivery = { countryId: 223, zoneId: 18 };
// Ontario delivery
const onDelivery = { countryId: 38, zoneId: 74 };
// Quebec delivery
const qcDelivery = { countryId: 38, zoneId: 76 };
// Germany delivery
const deDelivery = { countryId: 81, zoneId: 81 };

// Shipping selections
const flatShipping5 = { id: 'flat_flat', title: 'Flat Rate (Best Way)', cost: '5' };

// ── BR-14: order tax uses the delivery address ────────────────────────────────

describe('buildOrder — BR-14 delivery address tax', () => {
  test('BR-14 Florida delivery → 7% tax (fixture us-fl-basic-flat.json products[0].tax)', () => {
    // fixture us-fl-basic-flat.json: products[0].tax "7", taxDescription "FL TAX 7.0%"
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(phpStr(order.products[0].tax)).toBe('7');
    expect(order.products[0].taxDescription).toBe('FL TAX 7.0%');
  });

  test('BR-14 Ontario delivery → 13% HST (fixture ca-free-shipping-international.json products[0].tax)', () => {
    // fixture ca-free-shipping-international.json: products[0].tax "13", taxDescription "HST 13%"
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: onDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(phpStr(order.products[0].tax)).toBe('13');
    expect(order.products[0].taxDescription).toBe('HST 13%');
  });

  test('BR-14 Quebec delivery → compounded 15.47375% GST+QST (fixture ca-qc-compound.json products[0].tax)', () => {
    // fixture ca-qc-compound.json: products[0].tax "15.47375"
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: qcDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(phpStr(order.products[0].tax)).toBe('15.47375');
    expect(order.products[0].taxDescription).toBe('GST 5% + QST 9.975%');
  });
});

// ── BR-13: order finalPrice is price + attributes combined ───────────────────

describe('buildOrder — BR-13 finalPrice', () => {
  test('BR-13 product 1 with +50 +100 attributes → finalPrice = 449.99 (fixture us-fl-basic-flat.json products[0].finalPrice)', () => {
    // fixture: products[0].finalPrice "449.99" = 299.99 + 50 + 100
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(order.products[0].finalPrice).toBe(449.99);
  });

  test('BR-13 product 2 with +120 -10 attributes → finalPrice = 609.99 (fixture us-fl-negative-attribute.json products[0].finalPrice)', () => {
    // fixture: products[0].finalPrice "609.99" = 499.99 + 120 - 10
    const items = [
      { productId: 2, qty: 3, attributes: [{ optionId: 3, valueId: 7 }, { optionId: 4, valueId: 3 }] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(order.products[0].finalPrice).toBe(609.99);
  });
});

// ── BR-15: exclusive pricing: total = subtotal + tax + shipping ───────────────

describe('buildOrder — BR-15 exclusive pricing', () => {
  test('BR-15 subtotal=939.97, tax=65.7979, shipping=5, total=1010.7679 (fixture us-fl-basic-flat.json orderBeforeTotals)', () => {
    // fixture: subtotal "939.97", tax "65.7979", shippingCost "5", total "1010.7679"
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(phpStr(order.info.subtotal)).toBe('939.97');
    expect(phpStr(order.info.tax)).toBe('65.7979');
    expect(phpStr(order.info.total)).toBe('1010.7679');
  });

  test('BR-15 without shipping: total = subtotal + tax (no shipping cost)', () => {
    // When shipping=null, shippingCost=0, total = subtotal + tax + 0
    const items = [{ productId: 3, qty: 1, attributes: [] }];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalog, ctx);
    // product 3 price 39.99 (special status=1 at 39.99), tax 7% → shown_price=39.99
    // tax = 7/100 * 39.99 = 2.7993; total = 39.99 + 2.7993 = 42.7893
    expect(order.info.shippingCost).toBe(0);
    expect(order.info.total).toBeCloseTo(order.info.subtotal + order.info.tax, 10);
  });
});

// ── BR-16: inclusive pricing: tax is backed out, total = subtotal + shipping ──

describe('buildOrder — BR-16 inclusive pricing', () => {
  test('BR-16 total=subtotal+shipping when inclusive (fixture us-fl-inclusive-flat.json orderBeforeTotals)', () => {
    // fixture: subtotal "1005.77", tax "65.798037383178", total "1010.77"
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: true },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(String(order.info.subtotal)).toBe('1005.77');
    expect(String(order.info.total)).toBe('1010.77');
    // tax is backed out via inclusiveTaxPortion
    expect(order.info.tax).toBeCloseTo(65.798037383178, 8);
  });
});

// ── BR-17: tax grouped by tax description ────────────────────────────────────

describe('buildOrder — BR-17 tax groups', () => {
  test('BR-17 two tax classes produce two groups (fixture de-mixed-classes-eur.json taxGroups)', () => {
    // fixture: taxGroups [{MwSt 19%: 13.480...}, {MwSt 7%: 7.98}]
    const items = [
      { productId: 26, qty: 1, attributes: [{ optionId: 3, valueId: 9 }] },
      { productId: 4, qty: 2, attributes: [] },
      { productId: 5, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: eurCurrency, displayPriceWithTax: true },
      delivery: deDelivery,
      shipping: { id: 'flat_flat', title: 'Flat Rate (Best Way)', cost: '4.9' },
    };
    const order = buildOrder(items, catalog, ctx);
    const descriptions = order.info.taxGroups.map((g) => g.description);
    expect(descriptions).toContain('MwSt 19%');
    expect(descriptions).toContain('MwSt 7%');
    expect(order.info.taxGroups).toHaveLength(2);
  });

  test('BR-17 single tax class: one group (fixture us-fl-basic-flat.json taxGroups)', () => {
    // fixture: taxGroups [{FL TAX 7.0%: 65.7979}]
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(order.info.taxGroups).toHaveLength(1);
    expect(order.info.taxGroups[0].description).toBe('FL TAX 7.0%');
    expect(order.info.taxGroups[0].amount).toBeCloseTo(65.7979, 4);
  });

  test('Q-09 tax class 0 creates "Unknown tax rate" group with amount 0 (fixture us-fl-untaxed-product.json taxGroups)', () => {
    // fixture: taxGroups contains {description: "Unknown tax rate", amount: "0"}
    const items = [
      { productId: 31, qty: 2, attributes: [] }, // tax_class_id = 0
      { productId: 3, qty: 1, attributes: [] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder(items, catalog, ctx);
    const unknownGroup = order.info.taxGroups.find((g) => g.description === 'Unknown tax rate');
    expect(unknownGroup).toBeDefined();
    expect(unknownGroup.amount).toBe(0);
  });

  test('BR-17 empty cart produces zero tax groups', () => {
    // fixture us-fl-empty-cart.json: taxGroups []
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: flatShipping5,
    };
    const order = buildOrder([], catalog, ctx);
    expect(order.info.taxGroups).toHaveLength(0);
  });
});

// ── Q-04: order finalPrice combines product+attrs before rounding ─────────────

describe('buildOrder — Q-04 combined final price differs from cart', () => {
  test('Q-04 order subtotal uses combined finalPrice rounding (fixture us-fl-negative-attribute.json orderBeforeShipping.subtotal)', () => {
    // fixture: subtotal "1829.97"
    // Q-04: order prices product+attr together; cart prices them separately
    const items = [
      { productId: 2, qty: 3, attributes: [{ optionId: 3, valueId: 7 }, { optionId: 4, valueId: 3 }] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalog, ctx);
    expect(phpStr(order.info.subtotal)).toBe('1829.97');
  });
});

// ── Order.js defensive branches ──────────────────────────────────────────────

describe('buildOrder — defensive branches', () => {
  test('BR-13 catalog without products_options/values uses empty strings (order.js lines 105, 110, 119-122)', () => {
    // Covers the null-branch of: catalog.products_options ? ... : null
    // and: optRow ? ... : '' and valRow ? ... : ''
    const catalogWithoutOptions = {
      ...catalog,
      products_options: null,
      products_options_values: null,
    };
    const items = [
      { productId: 1, qty: 1, attributes: [{ optionId: 4, valueId: 2 }] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalogWithoutOptions, ctx);
    const attr = order.products[0].attributes[0];
    expect(attr.optionName).toBe('');
    expect(attr.valueName).toBe('');
  });

  test('BR-13 attribute with no matching paRow yields empty prefix and "0" price (order.js lines 121-122)', () => {
    // Cover paRow ? paRow.price_prefix : '' and paRow ? paRow.options_values_price : '0'
    const items = [
      { productId: 1, qty: 1, attributes: [{ optionId: 99, valueId: 99 }] }, // no matching paRow
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalog, ctx);
    const attr = order.products[0].attributes[0];
    expect(attr.prefix).toBe('');
    expect(attr.price).toBe('0');
  });
});

// ── contentType and delivery shape ───────────────────────────────────────────

describe('buildOrder — structure', () => {
  test('BR-13 contentType is always "physical"', () => {
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder([], catalog, ctx);
    expect(order.contentType).toBe('physical');
  });

  test('BR-13 delivery is reflected in order.delivery', () => {
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: onDelivery,
      shipping: null,
    };
    const order = buildOrder([], catalog, ctx);
    expect(order.delivery.countryId).toBe(38);
    expect(order.delivery.zoneId).toBe(74);
  });

  test('BR-13 order attribute rows include optionName, valueName, prefix, price', () => {
    // fixture us-fl-basic-flat.json: products[0].attributes[0] = {optionId:4, valueName:"8 mb", prefix:"+", price:"50"}
    const items = [
      { productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] },
    ];
    const ctx = {
      pricing: { currency: usdCurrency, displayPriceWithTax: false },
      delivery: flDelivery,
      shipping: null,
    };
    const order = buildOrder(items, catalog, ctx);
    const attr = order.products[0].attributes[0];
    expect(attr.optionName).toBe('Memory');
    expect(attr.valueName).toBe('8 mb');
    expect(attr.prefix).toBe('+');
    expect(attr.price).toBe('50.0000');
  });

  test('BR-14 currency and currencyValue are reflected in order.info', () => {
    const ctx = {
      pricing: { currency: eurCurrency, displayPriceWithTax: false },
      delivery: deDelivery,
      shipping: null,
    };
    const order = buildOrder([], catalog, ctx);
    expect(order.info.currency).toBe('EUR');
    expect(order.info.currencyValue).toBe('0.8870');
  });
});

// ── Order.js line 84 defensive branch: cartItem not found ────────────────────

describe('buildOrder — line 84 cartItem null defensive branch', () => {
  test('BR-13 cartItem not found (impossible in production) → attrPrice=0 (order.js line 84 false branch)', () => {
    // To hit the `cartItem ? ... : 0` false branch we need getProducts to return a
    // product whose cp.id doesn't match any items.find result. We achieve this by
    // using jest.isolateModules to inject a fake getProducts that returns a product
    // with a UPRID that doesn't match any item in the items array.
    let buildOrderMocked;
    jest.isolateModules(() => {
      // Mock the cart module so getProducts returns a phantom product
      jest.mock('../../src/domain/cart', () => {
        const real = jest.requireActual('../../src/domain/cart');
        return {
          ...real,
          getProducts: () => [{
            id: 'PHANTOM_UPRID_NOT_IN_ITEMS',
            productId: 1,
            name: 'Test',
            model: 'T',
            price: '10.0000',
            quantity: 1,
            weight: '0',
            finalPrice: 10,
            taxClassId: 1,
            attributes: [],
          }],
        };
      });
      buildOrderMocked = require('../../src/domain/order').buildOrder;
    });

    const catalog2 = require('../../../fixtures/catalog.json');
    const usdCur = catalog2.currencies.find((c) => c.code === 'USD');
    const ctx = {
      pricing: { currency: usdCur, displayPriceWithTax: false },
      delivery: { countryId: 223, zoneId: 18 },
      shipping: null,
    };
    // The phantom product has UPRID that doesn't match any item → cartItem = undefined → attrPrice=0
    const order = buildOrderMocked([{ productId: 1, qty: 1, attributes: [] }], catalog2, ctx);
    // Verify the order was built (defensive branch didn't crash)
    expect(order.contentType).toBe('physical');
    expect(order.products[0].finalPrice).toBe(10); // 10 + 0 (attrPrice=0 because cartItem=undefined)
  });
});
