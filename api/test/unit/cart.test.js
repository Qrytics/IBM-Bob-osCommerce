'use strict';

/**
 * Unit tests for cart.js — BR-09, BR-10, BR-11, BR-12 (plus Q-04, Q-05, Q-08).
 * Expected values from fixtures/golden/functions/cart_calculate.json and
 * fixtures/golden/scenarios/.
 */

const { phpFloatToString, phpToNumber } = require('../../src/domain/phpNumber');
// Normalise via PHP precision-14 string form (same as equivalence tests).
function phpStr(v) { return phpFloatToString(phpToNumber(v)); }

const catalog = require('../../../fixtures/catalog.json');
const { calculateCart, attributesPrice, getProducts } = require('../../src/domain/cart');

// USD currency context (store prices, exclusive)
const usdCtx = {
  currency: catalog.currencies.find((c) => c.code === 'USD'),
  displayPriceWithTax: false,
};

// ── BR-12: cart weight and item count ────────────────────────────────────────

describe('calculateCart', () => {
  test('BR-12 product 29 qty 1: total=10.01, weight=0.5, count=1 (fixture cart_calculate.json case 1)', () => {
    // fixture: displayPriceWithTax false, USD, items [{productId:29, qty:1}]
    // expected: total "10.01", weight "0.5", count 1
    const items = [{ productId: 29, qty: 1, attributes: [] }];
    const result = calculateCart(items, catalog, usdCtx);
    expect(String(result.total)).toBe('10.01');
    expect(String(result.weight)).toBe('0.5');
    expect(result.count).toBe(1);
  });

  test('BR-12 five products qty 32 total: total=1839.97, weight=155.25, count=32 (fixture cart_calculate.json case 2)', () => {
    // fixture: displayPriceWithTax false, EUR (but store uses USD for tax), items [...], expected total "1839.97", weight "155.25", count 32
    // Note: EUR currency affects rounding but the store tax is FL 7%. Use EUR ctx.
    const eurCtx = {
      currency: catalog.currencies.find((c) => c.code === 'EUR'),
      displayPriceWithTax: false,
    };
    const items = [
      { productId: 7, qty: 2, attributes: [] },
      { productId: 27, qty: 1, attributes: [] },
      { productId: 30, qty: 5, attributes: [] },
      { productId: 22, qty: 12, attributes: [] },
      { productId: 29, qty: 12, attributes: [] },
    ];
    const result = calculateCart(items, catalog, eurCtx);
    expect(phpStr(result.total)).toBe('1839.97');
    expect(phpStr(result.weight)).toBe('155.25');
    expect(result.count).toBe(32);
  });

  test('BR-09 BR-10 product with +120 and -10 attributes (3 qty): total=1829.97 (fixture us-fl-negative-attribute.json cart.total)', () => {
    // fixture: cart.total "1829.97"
    // product 2 qty 3, attributes: +120 (Deluxe), -10 (16mb)
    const items = [
      {
        productId: 2,
        qty: 3,
        attributes: [
          { optionId: 3, valueId: 7 }, // +120
          { optionId: 4, valueId: 3 }, // -10
        ],
      },
    ];
    const result = calculateCart(items, catalog, usdCtx);
    expect(String(result.total)).toBe('1829.97');
    expect(result.count).toBe(3);
  });

  test('BR-11 Q-05 cart taxes at store location (FL 7%), not delivery address (fixture ca-qc-compound.json cart.total)', () => {
    // fixture ca-qc-compound.json: cart.total "939.97" even though delivery is Quebec
    // The store is in FL; cart uses store location for tax → same result as us-fl-basic-flat
    const items = [
      {
        productId: 1,
        qty: 2,
        attributes: [
          { optionId: 4, valueId: 2 },
          { optionId: 3, valueId: 6 },
        ],
      },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const result = calculateCart(items, catalog, usdCtx);
    // fixture: cart.total "939.97"
    expect(String(result.total)).toBe('939.97');
  });

  test('BR-12 empty cart returns total=0, weight=0, count=0 (fixture us-fl-empty-cart.json cart)', () => {
    // fixture: cart.total "0", weight "0", count 0
    const result = calculateCart([], catalog, usdCtx);
    expect(result.total).toBe(0);
    expect(result.weight).toBe(0);
    expect(result.count).toBe(0);
  });

  test('Q-03 half-cent product 29 (10.005) qty 7 rounds per-unit → 10.01 × 7 = 70.07 (fixture us-fl-halfcent-exclusive.json cart.total)', () => {
    // fixture us-fl-halfcent-exclusive.json: cart.total "210.07" (products 29 & 30 qty 7 each)
    const items = [
      { productId: 29, qty: 7, attributes: [] },
      { productId: 30, qty: 7, attributes: [] },
    ];
    const result = calculateCart(items, catalog, usdCtx);
    // fixture: total "210.07"
    expect(String(result.total)).toBe('210.07');
  });

  test('Q-08 specials: products 5 and 6 have active specials (status=1) → their special price is used (fixture us-fl-specials.json cart.total)', () => {
    // fixture us-fl-specials.json: cart.total "449.96"
    // Products 5 & 6 have status=1 specials; product 7 has expired date but status=1 → applied
    const items = [
      { productId: 3, qty: 1, attributes: [] },
      { productId: 5, qty: 1, attributes: [] },
      { productId: 6, qty: 1, attributes: [] },
      { productId: 16, qty: 1, attributes: [] },
      { productId: 1, qty: 1, attributes: [] },
      { productId: 7, qty: 1, attributes: [] },
    ];
    const result = calculateCart(items, catalog, usdCtx);
    // fixture: cart.total "449.96"
    expect(phpStr(result.total)).toBe('449.96');
  });

  test('BR-12 cart with unknown product id is skipped (no crash)', () => {
    const items = [{ productId: 9999, qty: 1, attributes: [] }];
    const result = calculateCart(items, catalog, usdCtx);
    expect(result.total).toBe(0);
    expect(result.count).toBe(0);
  });

  test('BR-12 cart weight accumulates qty × products_weight (fixture us-fl-basic-flat.json cart.weight)', () => {
    // fixture: product 1 (weight 23) qty 2 + product 3 (weight 7) qty 1 = 53
    const items = [
      {
        productId: 1,
        qty: 2,
        attributes: [
          { optionId: 4, valueId: 2 },
          { optionId: 3, valueId: 6 },
        ],
      },
      { productId: 3, qty: 1, attributes: [] },
    ];
    const result = calculateCart(items, catalog, usdCtx);
    expect(result.weight).toBe(53);
    expect(result.count).toBe(3);
  });
});

// ── BR-10: attributesPrice sums +/- attribute deltas ─────────────────────────

describe('attributesPrice', () => {
  test('BR-10 product 2 with +120 and -10 attributes → net +110 (fixture us-fl-negative-attribute.json finalPrice=609.99)', () => {
    // 499.99 + 120 - 10 = 609.99 → attributesPrice = 110
    const item = { productId: 2, qty: 1, attributes: [{ optionId: 3, valueId: 7 }, { optionId: 4, valueId: 3 }] };
    expect(attributesPrice(item, catalog)).toBe(110);
  });

  test('BR-10 product with no attributes → attributesPrice = 0', () => {
    const item = { productId: 1, qty: 1, attributes: [] };
    expect(attributesPrice(item, catalog)).toBe(0);
  });

  test('BR-10 attribute row not found → price contribution is 0 (defensive branch)', () => {
    // attribute with non-existent option/value
    const item = { productId: 1, qty: 1, attributes: [{ optionId: 99, valueId: 99 }] };
    expect(attributesPrice(item, catalog)).toBe(0);
  });

  test('BR-10 product 1 with +50 (8mb) and +100 (Premium) → attributesPrice = 150 (fixture us-fl-basic-flat.json finalPrice=449.99)', () => {
    // finalPrice = 299.99 + 150 = 449.99
    const item = { productId: 1, qty: 1, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 3, valueId: 6 }] };
    expect(attributesPrice(item, catalog)).toBe(150);
  });
});

// ── BR-09 getProducts ────────────────────────────────────────────────────────

describe('getProducts', () => {
  test('BR-09 getProducts returns uprid, name, price, finalPrice, taxClassId for product 3', () => {
    // fixture us-fl-basic-flat.json: product 3 → id "3", price "39.99", finalPrice "39.99"
    // Note: product 3 has a special with status=1 at price "39.9900" (same as catalog price)
    const items = [{ productId: 3, qty: 1, attributes: [] }];
    const products = getProducts(items, catalog);
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('3');
    expect(products[0].taxClassId).toBe(1);
  });

  test('BR-09 Q-08 product 5 special (status=1) replaces catalog price: price="30" (fixture us-fl-specials.json)', () => {
    // fixture us-fl-specials.json: product 5 price "30" (special), catalog price "35.99"
    const items = [{ productId: 5, qty: 1, attributes: [] }];
    const products = getProducts(items, catalog);
    expect(products[0].price).toBe('30.0000');
  });

  test('BR-09 product 1 with status=0 special: catalog price is used (special 5 has status "0")', () => {
    // catalog specials: product 1 special has status "0" → ignored
    const items = [{ productId: 1, qty: 1, attributes: [] }];
    const products = getProducts(items, catalog);
    expect(products[0].price).toBe('299.9900');
  });

  test('BR-09 unknown product id is skipped (defensive branch: findProduct returns undefined)', () => {
    const items = [{ productId: 9999, qty: 1, attributes: [] }];
    const products = getProducts(items, catalog);
    expect(products).toHaveLength(0);
  });

  test('BR-09 product 7 has expired-date special with status=1 → still applied (Q-08)', () => {
    // catalog specials: product 7 has expires_date "2001-01-01" but status "1" → applied
    // fixture us-fl-specials.json: product 7 price "19.99"
    const items = [{ productId: 7, qty: 1, attributes: [] }];
    const products = getProducts(items, catalog);
    expect(products[0].price).toBe('19.9900');
  });

  test('BR-09 products_description table is used when present in catalog (cart.js line 120 branch)', () => {
    // Covers catalog.products_description truthy path (line 118-122)
    const catalogWithDesc = {
      ...catalog,
      products_description: [
        { products_id: 3, language_id: 1, products_name: 'Mouse (from description table)' },
      ],
    };
    const items = [{ productId: 3, qty: 1, attributes: [] }];
    const products = getProducts(items, catalogWithDesc);
    expect(products[0].name).toBe('Mouse (from description table)');
  });

  test('BR-09 when products_description has no row for product, falls back to product.products_name (cart.js line 123)', () => {
    // products_description is present but product 3 is not found → descRow=null → use product.products_name
    const catalogWithDescForOther = {
      ...catalog,
      products_description: [
        { products_id: 999, language_id: 1, products_name: 'Other Product' },
      ],
    };
    const items = [{ productId: 3, qty: 1, attributes: [] }];
    const products = getProducts(items, catalogWithDescForOther);
    // descRow is null → use product.products_name from catalog
    expect(products[0].name).toBe('Microsoft IntelliMouse Pro');
  });

  test('BR-09 when products_description is null and product has no products_name, falls back to empty string (cart.js line 123 || "" branch)', () => {
    // Covers the `product.products_name || ''` false branch (products_name is falsy)
    const catalogWithNamelessProduct = {
      ...catalog,
      products: [
        // product without products_name
        { products_id: 99, products_model: 'NONAME', products_price: '1.0000', products_weight: '0.10', products_tax_class_id: 1 },
        ...catalog.products,
      ],
      specials: catalog.specials,
    };
    const items = [{ productId: 99, qty: 1, attributes: [] }];
    const products = getProducts(items, catalogWithNamelessProduct);
    // descRow is null (no products_description), products_name is undefined → fallback ''
    expect(products[0].name).toBe('');
  });
});

// ── calculateCart attribute row missing ──────────────────────────────────────

describe('calculateCart — attribute row not found defensive branch', () => {
  test('BR-10 calculateCart skips attribute when no products_attributes row found (cart.js line 206 false branch)', () => {
    // Product 1 with an attribute (option 99, value 99) that has no row in products_attributes
    // → attrRow is undefined → if (attrRow) is false → total unchanged
    const items = [
      { productId: 1, qty: 1, attributes: [{ optionId: 99, valueId: 99 }] },
    ];
    const result = calculateCart(items, catalog, usdCtx);
    // product 1 price 299.99 (no special for status=0), tax 7% → 299.99 × 1 = 299.99
    // attribute not found → no addition/subtraction
    expect(phpStr(result.total)).toBe('299.99');
  });
});
