'use strict';

/**
 * LOCKED. HTTP behaviour that does not depend on the translated business logic.
 * These pass before and after the translation.
 */

const request = require('supertest');
const { createApp } = require('../../src/http/app');

const app = createApp();

const validCheckout = {
  settings: { displayPriceWithTax: false, currency: 'USD' },
  delivery: { countryId: 223, zoneId: 18 },
  shipping: { module: 'flat', cost: '5.00', taxClassId: 0 },
  items: [{ productId: 1, qty: 2, attributes: [{ optionId: 4, valueId: 2 }] }],
};

describe('platform endpoints', () => {
  test('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'cleancart-api' });
  });

  test('security headers are set and x-powered-by is hidden', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('GET /openapi.json serves the spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths)).toEqual(expect.arrayContaining([
      '/api/v1/tax/rate', '/api/v1/cart/calculate', '/api/v1/checkout/totals', '/api/v1/equivalence',
    ]));
  });

  test('GET /docs serves Swagger UI', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger/i);
  });

  test('GET / serves the demo UI', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/CleanCart/);
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFound');
  });
});

describe('catalog endpoints', () => {
  test('GET /api/v1/products lists the demo catalog with specials and options', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    const mouse = res.body.products.find((p) => p.id === 3);
    expect(mouse).toMatchObject({ name: 'Microsoft IntelliMouse Pro', price: '49.9900', specialPrice: '39.9900' });
    const matrox = res.body.products.find((p) => p.id === 1);
    expect(matrox.options.map((o) => o.name)).toEqual(['Memory', 'Model']);
  });

  test('GET /api/v1/products/:id', async () => {
    expect((await request(app).get('/api/v1/products/26')).body.name).toBe('Microsoft IntelliMouse Explorer');
    expect((await request(app).get('/api/v1/products/999')).status).toBe(404);
    expect((await request(app).get('/api/v1/products/abc')).status).toBe(404);
  });

  test('GET /api/v1/reference', async () => {
    const res = await request(app).get('/api/v1/reference');
    expect(res.body.currencies.map((c) => c.code)).toEqual(['USD', 'EUR', 'JPY']);
    expect(res.body.store).toMatchObject({ countryId: 223, zoneId: 18 });
  });

  test('GET /api/v1/scenarios lists the golden legacy scenarios', async () => {
    const res = await request(app).get('/api/v1/scenarios');
    expect(res.body.scenarios.length).toBeGreaterThan(30);
    expect(res.body.scenarios.find((s) => s.name === 'us-fl-basic-flat')).toMatchObject({ curated: true });
  });

  test('GET /api/v1/scenarios/:name returns input and legacy output', async () => {
    const res = await request(app).get('/api/v1/scenarios/us-fl-basic-flat');
    expect(res.status).toBe(200);
    expect(res.body.expected.orderTotals.at(-1).text).toBe('<strong>$1,010.77</strong>');
    expect((await request(app).get('/api/v1/scenarios/nope')).status).toBe(404);
    expect((await request(app).get('/api/v1/scenarios/nope/compare')).status).toBe(404);
  });

  test('GET /api/v1/equivalence reports every check', async () => {
    const res = await request(app).get('/api/v1/equivalence');
    expect(res.status).toBe(200);
    expect(res.body.cases).toBeGreaterThan(2000);
    expect(res.body.modules.map((m) => m.module)).toEqual(['general', 'tax', 'currency', 'cart', 'order', 'shipping', 'ot', 'pipeline']);
  });
});

describe('request validation', () => {
  const post = (path, body) => request(app).post(path).send(body);

  test('malformed JSON is a 400', async () => {
    const res = await request(app).post('/api/v1/checkout/totals').set('Content-Type', 'application/json').send('{"items":');
    expect(res.status).toBe(400);
  });

  test('unknown products, attributes, locations and currencies are rejected', async () => {
    const res = await post('/api/v1/checkout/totals', {
      ...validCheckout,
      settings: { currency: 'XXX' },
      delivery: { countryId: 223, zoneId: 76 },
      items: [{ productId: 999, qty: 1 }, { productId: 1, qty: 1, attributes: [{ optionId: 4, valueId: 99 }] }],
    });
    expect(res.status).toBe(400);
    const paths = res.body.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['settings.currency', 'delivery.zoneId', 'items.0.productId', 'items.1.attributes.0']));
  });

  test('unknown country and tax class are rejected', async () => {
    const res = await post('/api/v1/checkout/totals', { ...validCheckout, delivery: { countryId: 1, zoneId: 0 }, shipping: { module: 'flat', cost: '1', taxClassId: 42 } });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.path)).toEqual(expect.arrayContaining(['delivery.countryId', 'shipping.taxClassId']));
  });

  test('duplicate lines and repeated options are rejected', async () => {
    const line = { productId: 1, qty: 1, attributes: [{ optionId: 4, valueId: 2 }, { optionId: 4, valueId: 3 }] };
    const res = await post('/api/v1/checkout/totals', { ...validCheckout, items: [line, line] });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.message).join(' ')).toMatch(/chosen twice/);
    expect(res.body.details.map((d) => d.message).join(' ')).toMatch(/duplicate cart line/);
  });

  test('bad quantities, decimals, tables and unknown fields are rejected', async () => {
    for (const bad of [
      { ...validCheckout, items: [{ productId: 1, qty: 0 }] },
      { ...validCheckout, shipping: { module: 'flat', cost: '-1' } },
      { ...validCheckout, shipping: { module: 'flat', cost: '1.23456' } },
      { ...validCheckout, shipping: { module: 'table', table: 'cheap' } },
      { ...validCheckout, shipping: { module: 'zones' } },
      { ...validCheckout, settings: { shippingBox: { weight: '3', padding: '10', maxWeight: '0' } } },
      { ...validCheckout, extra: true },
    ]) {
      expect((await post('/api/v1/checkout/totals', bad)).status).toBe(400);
    }
  });

  test('tax rate request validation', async () => {
    expect((await post('/api/v1/tax/rate', { taxClassId: 1 })).status).toBe(400);
    expect((await post('/api/v1/tax/rate', { taxClassId: 7, countryId: 223, zoneId: 18 })).status).toBe(400);
  });

  test('cart request validation', async () => {
    expect((await post('/api/v1/cart/calculate', { items: [{ productId: 1, qty: 1.5 }] })).status).toBe(400);
    expect((await post('/api/v1/cart/calculate', { items: [], settings: { currency: 'GBP' } })).status).toBe(400);
  });

  test('oversized bodies are rejected', async () => {
    const res = await request(app).post('/api/v1/checkout/totals').set('Content-Type', 'application/json').send(`{"x":"${'a'.repeat(200 * 1024)}"}`);
    expect(res.status).toBe(413);
  });
});
