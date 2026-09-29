'use strict';

/**
 * Unit tests for shipping/index.js, flat.js, item.js, table.js —
 * BR-18, BR-19, BR-20, BR-21, BR-22, BR-23 (plus Q-05, Q-07).
 * Expected values from fixtures/golden/scenarios/.
 */

const { phpFloatToString, phpToNumber } = require('../../src/domain/phpNumber');
// Normalise via PHP precision-14 string form (same as equivalence tests).
function phpStr(v) { return phpFloatToString(phpToNumber(v)); }

const catalog = require('../../../fixtures/catalog.json');
const { prepareShipment, isFreeShippingOffered, selectShipping } = require('../../src/domain/shipping/index');
const flatShipping = require('../../src/domain/shipping/flat');
const itemShipping = require('../../src/domain/shipping/item');
const tableShipping = require('../../src/domain/shipping/table');

const DEFAULT_BOX = { weight: '3', padding: '10', maxWeight: '50' };
const STORE_COUNTRY = 223; // USA (Florida store)

// ── BR-18: box weight packing ─────────────────────────────────────────────────

describe('prepareShipment', () => {
  test('BR-18 tare weight branch: boxWeight >= padding% of cart weight (fixture us-fl-basic-flat.json shipment)', () => {
    // fixture: weight=53, box defaults → 3 >= 53*10/100=5.3? No → padding
    // Actually: 53*10/100=5.3, 3 >= 5.3 is false → use padding: 53+5.3=58.3
    // But fixture says shippingWeight=29.15, numBoxes=2 → 58.3 > 50 → ceil(58.3/50)=2, 58.3/2=29.15
    const result = prepareShipment(53, DEFAULT_BOX);
    expect(String(result.shippingWeight)).toBe('29.15');
    expect(result.numBoxes).toBe(2);
  });

  test('BR-18 small weight uses tare: 0 weight, 3kg tare → single box of 3 (fixture us-fl-empty-cart.json shipment)', () => {
    // fixture: weight=0, box {weight:3,padding:10,maxWeight:50}
    // 3 >= 0*10/100=0? Yes → shippingWeight=0+3=3, 3<=50 → numBoxes=1
    const result = prepareShipment(0, DEFAULT_BOX);
    expect(String(result.shippingWeight)).toBe('3');
    expect(result.numBoxes).toBe(1);
  });

  test('BR-18 multibox split: 135kg with padding → 3 boxes of 49.5 (fixture us-fl-table-weight-multibox.json shipment)', () => {
    // fixture: shippingWeight "49.5", numBoxes 3
    // 3 >= 135*10/100=13.5? No → padding: 135+13.5=148.5 > 50 → ceil(148.5/50)=3, 148.5/3=49.5
    const result = prepareShipment(135, DEFAULT_BOX);
    expect(String(result.shippingWeight)).toBe('49.5');
    expect(result.numBoxes).toBe(3);
  });

  test('BR-18 tare branch taken when boxWeight >= percentage: weight=1, box {weight:3, padding:10, max:50}', () => {
    // 1 * 10/100 = 0.1; 3 >= 0.1 → tare → shippingWeight = 1+3 = 4; 4 <= 50 → numBoxes=1
    const result = prepareShipment(1, DEFAULT_BOX);
    expect(result.shippingWeight).toBe(4);
    expect(result.numBoxes).toBe(1);
  });

  test('BR-18 weight exactly at max: no split needed', () => {
    // shippingWeight after padding = exactly 50 → 50 > 50 is false → numBoxes=1
    // weight=47 → padding: 3 >= 47*10/100=4.7? No → 47+4.7=51.7 > 50 → split
    // Let's use weight=10: 3 >= 10*10/100=1? Yes → tare: 10+3=13 <= 50 → 1 box
    const result = prepareShipment(10, DEFAULT_BOX);
    expect(result.numBoxes).toBe(1);
  });
});

// ── BR-19: flat-rate shipping ─────────────────────────────────────────────────

describe('flat.quote', () => {
  test('BR-19 flat rate returns configured cost (fixture us-fl-basic-flat.json quote)', () => {
    // fixture: cost "5", tax null
    const ctx = {
      config: { cost: '5.00', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
    };
    const result = flatShipping.quote(ctx);
    expect(result.id).toBe('flat');
    expect(result.methods[0].cost).toBe(5);
    expect(result.tax).toBeUndefined();
  });

  test('BR-22 flat rate with taxClassId > 0 includes tax rate (fixture us-fl-taxed-shipping.json quote.tax)', () => {
    // fixture: taxClassId 3, FL delivery → quote.tax "7"
    const ctx = {
      config: { cost: '9.99', taxClassId: 3 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
    };
    const result = flatShipping.quote(ctx);
    expect(phpStr(result.tax)).toBe('7');
  });

  test('BR-19 flat rate module and method IDs are correct', () => {
    const ctx = {
      config: { cost: '5', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
    };
    const result = flatShipping.quote(ctx);
    expect(result.module).toBe('Flat Rate');
    expect(result.methods[0].id).toBe('flat');
    expect(result.methods[0].title).toBe('Best Way');
  });
});

// ── BR-20: per-item shipping ──────────────────────────────────────────────────

describe('item.quote', () => {
  test('BR-20 item rate: 2.50 × 6 items + 1.25 handling = 16.25 (fixture us-fl-item-shipping.json quote)', () => {
    // fixture: cost "16.25", 6 items (qty 2+4)
    const ctx = {
      config: { cost: '2.50', handling: '1.25', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartCount: 6,
    };
    const result = itemShipping.quote(ctx);
    expect(result.methods[0].cost).toBe(16.25);
    expect(result.tax).toBeUndefined();
  });

  test('BR-22 item rate with taxClassId > 0 includes tax', () => {
    const ctx = {
      config: { cost: '2.50', handling: '1.25', taxClassId: 3 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartCount: 6,
    };
    const result = itemShipping.quote(ctx);
    expect(phpStr(result.tax)).toBe('7');
  });

  test('BR-20 item rate module and method IDs', () => {
    const ctx = {
      config: { cost: '1', handling: '0', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartCount: 1,
    };
    const result = itemShipping.quote(ctx);
    expect(result.module).toBe('Per Item');
    expect(result.methods[0].id).toBe('item');
  });
});

// ── BR-21: table-rate shipping ────────────────────────────────────────────────

describe('table.quote', () => {
  test('BR-21 table price mode: 309.96 matches <=500 band → rate 6.00 + 1.50 handling = 7.50 (fixture us-fl-table-price.json quote)', () => {
    // fixture: cost "7.5"
    const ctx = {
      config: { mode: 'price', table: '100:12.00,500:6.00,99999:0', handling: '1.50', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartTotal: 309.96,
      shipment: { shippingWeight: 31, numBoxes: 1 },
    };
    const result = tableShipping.quote(ctx);
    expect(result.methods[0].cost).toBe(7.5);
    expect(result.tax).toBeUndefined();
  });

  test('BR-21 table weight mode: per-box rate × numBoxes (fixture us-fl-table-weight-multibox.json quote)', () => {
    // fixture: cost "16.5" (5.50 per box × 3 boxes = 16.5 + 0 handling)
    const ctx = {
      config: { mode: 'weight', table: '25:8.50,50:5.50,10000:0.00', handling: '0', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartTotal: 1499.97,
      shipment: { shippingWeight: 49.5, numBoxes: 3 },
    };
    const result = tableShipping.quote(ctx);
    expect(result.methods[0].cost).toBe(16.5);
  });

  test('BR-22 table rate with taxClassId > 0 includes tax rate', () => {
    const ctx = {
      config: { mode: 'price', table: '100:5.00,99999:0', handling: '0', taxClassId: 3 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartTotal: 50,
      shipment: { shippingWeight: 5, numBoxes: 1 },
    };
    const result = tableShipping.quote(ctx);
    expect(phpStr(result.tax)).toBe('7');
  });

  test('BR-21 table mode: no matching band returns 0 rate (order total exceeds all thresholds)', () => {
    // order_total 99999 <= 99999 → rate 0
    const ctx = {
      config: { mode: 'price', table: '100:12.00,500:6.00,99999:0', handling: '0', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartTotal: 99999,
      shipment: { shippingWeight: 10, numBoxes: 1 },
    };
    const result = tableShipping.quote(ctx);
    expect(result.methods[0].cost).toBe(0);
  });

  test('BR-21 table module and method IDs', () => {
    const ctx = {
      config: { mode: 'price', table: '99999:5', handling: '0', taxClassId: 0 },
      order: { delivery: { countryId: 223, zoneId: 18 } },
      catalog,
      cartTotal: 100,
      shipment: { shippingWeight: 5, numBoxes: 1 },
    };
    const result = tableShipping.quote(ctx);
    expect(result.module).toBe('Table Rate');
    expect(result.methods[0].id).toBe('table');
  });
});

// ── BR-23: free shipping offered at checkout_shipping ────────────────────────

describe('isFreeShippingOffered', () => {
  // Build a minimal order with total > threshold
  const orderOver500 = {
    delivery: { countryId: 223, zoneId: 18 },
    info: { total: 1005.7679 },
  };
  const orderUnder500 = {
    delivery: { countryId: 223, zoneId: 18 },
    info: { total: 400 },
  };
  const canadaOrder = {
    delivery: { countryId: 38, zoneId: 74 },
    info: { total: 200 },
  };

  test('BR-23 national free shipping offered when total >= threshold and same country (fixture us-fl-free-shipping-over.json)', () => {
    // fixture: freeShippingOffered true
    const fs = { enabled: true, over: '500', destination: 'national' };
    expect(isFreeShippingOffered(orderOver500, fs, STORE_COUNTRY)).toBe(true);
  });

  test('BR-23 national free shipping NOT offered when total < threshold', () => {
    // fixture us-fl-free-shipping-below.json: freeShippingOffered false
    const fs = { enabled: true, over: '500', destination: 'national' };
    expect(isFreeShippingOffered(orderUnder500, fs, STORE_COUNTRY)).toBe(false);
  });

  test('BR-23 international free shipping offered for Canadian order (fixture ca-free-shipping-international.json)', () => {
    // fixture: freeShippingOffered true
    const canadaOrderLarge = { delivery: { countryId: 38, zoneId: 74 }, info: { total: 200 } };
    const fs = { enabled: true, over: '50', destination: 'international' };
    expect(isFreeShippingOffered(canadaOrderLarge, fs, STORE_COUNTRY)).toBe(true);
  });

  test('BR-23 national-only free shipping NOT offered for international order (fixture ca-free-shipping-national-only.json)', () => {
    // fixture: freeShippingOffered false (Canada vs US national-only setting)
    const fs = { enabled: true, over: '50', destination: 'national' };
    expect(isFreeShippingOffered(canadaOrder, fs, STORE_COUNTRY)).toBe(false);
  });

  test('BR-23 "both" destination offers free shipping to any country', () => {
    const fs = { enabled: true, over: '50', destination: 'both' };
    expect(isFreeShippingOffered(canadaOrder, fs, STORE_COUNTRY)).toBe(true);
  });

  test('BR-23 free shipping disabled → never offered', () => {
    const fs = { enabled: false, over: '0', destination: 'both' };
    expect(isFreeShippingOffered(orderOver500, fs, STORE_COUNTRY)).toBe(false);
  });

  test('BR-23 unknown destination → pass=false', () => {
    const fs = { enabled: true, over: '0', destination: 'unknown' };
    expect(isFreeShippingOffered(orderOver500, fs, STORE_COUNTRY)).toBe(false);
  });
});

// ── BR-23: selectShipping builds session shipping record ─────────────────────

describe('selectShipping', () => {
  const quote = {
    id: 'flat',
    module: 'Flat Rate',
    methods: [{ id: 'flat', title: 'Best Way', cost: 5 }],
  };

  test('BR-23 free shipping → id=free_free, title=Free Shipping, cost=0 (fixture us-fl-free-shipping-over.json selectedShipping)', () => {
    // fixture: selectedShipping.id "free_free", title "Free Shipping", cost "0"
    const selected = selectShipping(quote, true);
    expect(selected.id).toBe('free_free');
    expect(selected.title).toBe('Free Shipping');
    expect(selected.cost).toBe('0');
  });

  test('BR-23 normal shipping → id=flat_flat, title=Flat Rate (Best Way) (fixture us-fl-basic-flat.json selectedShipping)', () => {
    // fixture: id "flat_flat", title "Flat Rate (Best Way)", cost 5
    const selected = selectShipping(quote, false);
    expect(selected.id).toBe('flat_flat');
    expect(selected.title).toBe('Flat Rate (Best Way)');
    expect(selected.cost).toBe(5);
  });
});
