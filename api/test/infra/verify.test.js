'use strict';

/**
 * LOCKED. Tests for the provided verification and error-handling infrastructure.
 * They pass whether or not the domain modules are translated.
 */

const { diff, expectLegacyEqual, php } = require('../../src/verify/compare');
const { runCheck, buildChecks, MODULES } = require('../../src/verify/checks');
const { NotImplemented } = require('../../src/domain/errors');
const { errorHandler } = require('../../src/http/errors');
const { checkoutTotals, resolveSettings } = require('../../src/domain');
const { getCatalog } = require('../../src/data/catalogRepo');

describe('compare.diff', () => {
  test('numbers are compared after PHP normalisation, with no tolerance', () => {
    expect(diff({ total: '10.70' }, { total: '10.7' })).toEqual([]);
    expect(diff({ total: 0.1 + 0.2 }, { total: '0.3' })).toEqual([]);
    expect(diff({ total: 10.700000001 }, { total: '10.7' })).toHaveLength(1);
    expect(php(undefined)).toBeNull();
  });

  test('integers, booleans and strings', () => {
    expect(diff({ qty: '3', ok: true, name: 'x' }, { qty: 3, ok: true, name: 'x' })).toEqual([]);
    expect(diff({ qty: 2, ok: false, name: 'y' }, { qty: 3, ok: true, name: 'x' })).toHaveLength(3);
    expect(diff({ qty: undefined }, { qty: 3 })).toHaveLength(1);
    expect(diff({ shippingMethod: undefined }, { shippingMethod: '' })).toEqual([]);
    expect(diff({ tax: undefined }, { tax: null })).toEqual([]);
  });

  test('shape mismatches are reported', () => {
    expect(diff(null, [1])[0]).toMatch(/expected an array/);
    expect(diff([1, 2], ['1'])[0]).toMatch(/expected 1 entries, got 2/);
    expect(diff('x', { a: '1' })[0]).toMatch(/expected an object/);
  });

  test('the `exact` block is an input, not an output', () => {
    expect(diff({}, { exact: { cost: 1 } })).toEqual([]);
  });

  test('expectLegacyEqual throws a readable error', () => {
    expect(() => expectLegacyEqual({ total: 1 }, { total: '1' }, 'x')).not.toThrow();
    const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, 'a']));
    expect(() => expectLegacyEqual({}, many, 'label')).toThrow(/label differs from legacy PHP output in 20 place/);
  });
});

describe('checks.runCheck', () => {
  const base = { id: 'x', module: 'general', task: 'T3', title: 't', label: (c) => `case ${c}` };

  test('counts passes and failures', () => {
    const r = runCheck({ ...base, cases: [1, 2, 3], run: (c) => (c === 2 ? ['bad'] : []) });
    expect(r).toMatchObject({ total: 3, passed: 2, failed: 1, notImplemented: null });
    expect(r.failures).toEqual([{ label: 'case 2', problems: ['bad'] }]);
  });

  test('records exceptions as failures', () => {
    const r = runCheck({ ...base, cases: [1], run: () => { throw new Error('boom'); } });
    expect(r.failed).toBe(1);
    expect(r.failures[0].problems[0]).toMatch(/boom/);
    const s = runCheck({ ...base, cases: [1], run: () => { throw 'plain'; } });
    expect(s.failures[0].problems[0]).toMatch(/plain/);
  });

  test('stops at the first NotImplemented', () => {
    const r = runCheck({ ...base, cases: [1, 2], run: () => { throw new NotImplemented('T3', 'tepRound'); } });
    expect(r.notImplemented).toMatch(/tepRound is not implemented yet/);
    expect(r.failed).toBe(2);
  });

  test('limits the number of reported failures', () => {
    const r = runCheck({ ...base, cases: [1, 2, 3], run: () => ['bad'] }, { maxFailures: 1 });
    expect(r.failures).toHaveLength(1);
  });

  test('every module has checks and a task', () => {
    const checks = buildChecks();
    for (const m of MODULES) expect(checks.some((c) => c.module === m.module && c.task === m.task)).toBe(true);
  });

  test('a golden directory without scenarios still builds function checks', () => {
    const fs = require('node:fs');
    const os = require('node:os');
    const path = require('node:path');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cleancart-'));
    fs.symlinkSync(path.resolve(__dirname, '../../../fixtures/golden/functions'), path.join(dir, 'functions'));
    const checks = buildChecks(dir);
    expect(checks.find((c) => c.id === 'tep_round').cases.length).toBeGreaterThan(100);
    expect(checks.find((c) => c.id === 'scenario_pipeline').cases).toEqual([]);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('http errorHandler', () => {
  const res = () => {
    const r = { statusCode: 0, body: null };
    r.status = (s) => { r.statusCode = s; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
  };

  test('NotImplemented becomes 501 with the task id', () => {
    const r = res();
    errorHandler(new NotImplemented('T4', 'getTaxRate'), {}, r, () => {});
    expect(r.statusCode).toBe(501);
    expect(r.body).toMatchObject({ error: 'NotImplemented', task: 'T4', function: 'getTaxRate' });
  });

  test('unexpected errors become a generic 500', () => {
    const r = res();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    errorHandler(new Error('secret detail'), {}, r, () => {});
    process.env.NODE_ENV = env;
    spy.mockRestore();
    expect(r.statusCode).toBe(500);
    expect(JSON.stringify(r.body)).not.toMatch(/secret/);
  });
});

describe('domain/index.js input resolution', () => {
  const catalog = getCatalog();

  test('defaults', () => {
    const s = resolveSettings({}, catalog);
    expect(s.pricing).toMatchObject({ displayPriceWithTax: false, currency: { code: 'USD' } });
    expect(s.shippingBox).toEqual({ weight: '3', padding: '10', maxWeight: '50' });
    expect(s.freeShipping.enabled).toBe(false);
  });

  test('unknown currency or shipping module', () => {
    expect(() => resolveSettings({ currency: 'XXX' }, catalog)).toThrow(RangeError);
    expect(() => checkoutTotals({ delivery: { countryId: 223, zoneId: 18 }, shipping: { module: 'zones' } }, catalog)).toThrow(RangeError);
  });
});
