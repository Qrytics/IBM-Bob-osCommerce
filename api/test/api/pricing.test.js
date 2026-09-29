'use strict';

/**
 * LOCKED. The pricing endpoints must return exactly what the legacy PHP produced.
 * These fail with 501 Not Implemented until the domain layer is translated.
 */

const request = require('supertest');
const { createApp } = require('../../src/http/app');
const repo = require('../../src/data/catalogRepo');
const { diff, php } = require('../../src/verify/compare');

const app = createApp();
const golden = (name) => repo.getScenario(name);
const bodyOf = ({ scenario }) => ({ settings: scenario.settings, delivery: scenario.delivery, shipping: scenario.shipping, items: scenario.items });
const explain = (res) => (res.status === 501 ? `501 ${res.body.message}` : JSON.stringify(res.body).slice(0, 500));

describe('POST /api/v1/checkout/totals', () => {
  test.each(repo.getScenarios().filter((s) => !s.scenario.name.startsWith('random-')).map((s) => [s.scenario.name]))(
    'matches the legacy PHP output for %s',
    async (name) => {
      const s = golden(name);
      const res = await request(app).post('/api/v1/checkout/totals').send(bodyOf(s));
      if (res.status !== 200) throw new Error(explain(res));
      expect(diff(res.body, s.expected)).toEqual([]);
    },
  );
});

describe('POST /api/v1/cart/calculate', () => {
  test('matches the legacy cart page totals', async () => {
    const s = golden('us-fl-jpy-rounds-dollars');
    const res = await request(app).post('/api/v1/cart/calculate').send({ items: s.scenario.items, settings: { currency: 'JPY', displayPriceWithTax: true } });
    if (res.status !== 200) throw new Error(explain(res));
    expect(diff(res.body, s.expected.cart)).toEqual([]);
    expect(res.body.products.map((p) => p.id)).toEqual(['25{1}14', '1{4}2{3}6', '26{3}9']);
  });
});

describe('POST /api/v1/tax/rate', () => {
  test('compounds Quebec GST and QST like tep_get_tax_rate()', async () => {
    const res = await request(app).post('/api/v1/tax/rate').send({ taxClassId: 1, countryId: 38, zoneId: 76 });
    if (res.status !== 200) throw new Error(explain(res));
    expect(php(res.body.rate)).toBe('15.47375');
    expect(res.body.description).toBe('GST 5% + QST 9.975%');
  });

  test('falls back to "Unknown tax rate" where nothing applies', async () => {
    const res = await request(app).post('/api/v1/tax/rate').send({ taxClassId: 1, countryId: 223, zoneId: 12 });
    if (res.status !== 200) throw new Error(explain(res));
    expect(res.body).toMatchObject({ rate: 0, description: 'Unknown tax rate' });
  });
});

describe('GET /api/v1/scenarios/:name/compare', () => {
  test('reports the modern pipeline identical to the legacy output', async () => {
    const res = await request(app).get('/api/v1/scenarios/ca-qc-compound-inclusive/compare');
    if (res.status !== 200) throw new Error(explain(res));
    expect(res.body.differences).toEqual([]);
    expect(res.body.identical).toBe(true);
  });
});

describe('GET /api/v1/equivalence', () => {
  test('every golden case is equivalent', async () => {
    const res = await request(app).get('/api/v1/equivalence');
    const failing = res.body.checks.filter((c) => c.passed !== c.total).map((c) => `${c.id}: ${c.passed}/${c.total} ${c.notImplemented || ''}`);
    expect(failing).toEqual([]);
    expect(res.body.equivalent).toBe(true);
  });
});
