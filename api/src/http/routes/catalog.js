'use strict';

/** Catalog, legacy scenario and equivalence endpoints (PROVIDED, LOCKED). */

const express = require('express');
const repo = require('../../data/catalogRepo');
const { checkoutTotals } = require('../../domain');
const { diff } = require('../../verify/compare');
const { runAll, MODULES } = require('../../verify/checks');

const router = express.Router();

router.get('/products', (req, res) => res.json({ products: repo.listProducts() }));

router.get('/products/:id', (req, res) => {
  const product = /^\d+$/.test(req.params.id) ? repo.getProduct(Number(req.params.id)) : null;
  if (!product) {
    res.status(404).json({ error: 'NotFound', message: `No product ${req.params.id}` });
    return;
  }
  res.json(product);
});

router.get('/reference', (req, res) => res.json(repo.reference()));

router.get('/scenarios', (req, res) => {
  res.json({
    scenarios: repo.getScenarios().map(({ scenario }) => ({
      name: scenario.name, description: scenario.description, curated: !scenario.name.startsWith('random-'),
    })),
  });
});

router.get('/scenarios/:name', (req, res) => {
  const s = repo.getScenario(req.params.name);
  if (!s) {
    res.status(404).json({ error: 'NotFound', message: `No scenario ${req.params.name}` });
    return;
  }
  res.json(s);
});

/** Run a golden scenario through the modern pipeline and diff it with the legacy output. */
router.get('/scenarios/:name/compare', (req, res) => {
  const s = repo.getScenario(req.params.name);
  if (!s) {
    res.status(404).json({ error: 'NotFound', message: `No scenario ${req.params.name}` });
    return;
  }
  const modern = checkoutTotals(s.scenario, repo.getCatalog());
  const differences = diff(modern, s.expected);
  res.json({ name: s.scenario.name, identical: differences.length === 0, differences, legacy: s.expected, modern });
});

let report;
/** Live equivalence report: every golden fixture re-checked against the running code. */
router.get('/equivalence', (req, res) => {
  if (!report) {
    const started = Date.now();
    const checks = runAll({ maxFailures: 3 });
    const cases = checks.reduce((n, c) => n + c.total, 0);
    const passed = checks.reduce((n, c) => n + c.passed, 0);
    const modules = MODULES.map((m) => {
      const mine = checks.filter((c) => c.module === m.module);
      return {
        ...m,
        implemented: mine.every((c) => !c.notImplemented),
        passed: mine.reduce((n, c) => n + c.passed, 0),
        total: mine.reduce((n, c) => n + c.total, 0),
      };
    });
    report = { equivalent: passed === cases, cases, passed, durationMs: Date.now() - started, modules, checks };
  }
  res.json(report);
});

module.exports = router;
