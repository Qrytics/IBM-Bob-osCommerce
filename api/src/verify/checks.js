'use strict';

/**
 * Equivalence checks: modern domain code vs. golden legacy output (PROVIDED, LOCKED).
 *
 * The Jest equivalence suites, `npm run status` and the live GET /api/v1/equivalence
 * report all use this one list, so they always agree.
 *
 * Each check belongs to one module (the BOB_TASKS.md task that makes it pass) and
 * evaluates one fixture file (or one stage of every scenario) case by case.
 * Scenario stages take their inputs from earlier stages of the MODERN code (or from
 * the full-precision `exact` block), so each stage can be checked on its own.
 */

const fs = require('node:fs');
const path = require('node:path');
const { diff, php } = require('./compare');
const { NotImplemented } = require('../domain/errors');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const DEFAULT_GOLDEN_DIR = path.join(REPO_ROOT, 'fixtures/golden');

const domain = {
  get general() { return require('../domain/general'); },
  get tax() { return require('../domain/tax'); },
  get currency() { return require('../domain/currency'); },
  get cart() { return require('../domain/cart'); },
  get order() { return require('../domain/order'); },
  get shipping() { return require('../domain/shipping'); },
  get orderTotals() { return require('../domain/orderTotals'); },
  get pipeline() { return require('../domain'); },
};

/** Modules in the order Bob translates them (BOB_TASKS.md T3-T9). */
const MODULES = [
  { module: 'general', task: 'T3', files: ['general.js'] },
  { module: 'tax', task: 'T4', files: ['tax.js'] },
  { module: 'currency', task: 'T5', files: ['currency.js'] },
  { module: 'cart', task: 'T6', files: ['cart.js'] },
  { module: 'order', task: 'T7', files: ['order.js'] },
  { module: 'shipping', task: 'T8', files: ['shipping/index.js', 'shipping/flat.js', 'shipping/item.js', 'shipping/table.js'] },
  { module: 'ot', task: 'T9', files: ['orderTotals/*.js'] },
  { module: 'pipeline', task: 'T3-T9', files: ['index.js (provided) end-to-end'] },
];

const numberCheck = (actual, expected) => (php(actual) === expected ? [] : [`expected ${expected}, got ${php(actual)} (raw ${JSON.stringify(actual)})`]);
const stringCheck = (actual, expected) => (actual === expected ? [] : [`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`]);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Build the list of checks for one golden directory.
 * @param {string} [goldenDir]
 */
function buildChecks(goldenDir = DEFAULT_GOLDEN_DIR) {
  const catalog = loadJson(path.join(REPO_ROOT, 'fixtures/catalog.json'));
  const currency = (code) => catalog.currencies.find((c) => c.code === code);
  const fn = (group) => loadJson(path.join(goldenDir, 'functions', `${group}.json`)).cases;
  const scenarioDir = path.join(goldenDir, 'scenarios');
  const scenarios = fs.existsSync(scenarioDir)
    ? fs.readdirSync(scenarioDir).filter((f) => f.endsWith('.json')).sort().map((f) => loadJson(path.join(scenarioDir, f)))
    : [];

  const ctxFor = (s) => {
    const settings = domain.pipeline.resolveSettings(s.scenario.settings || {}, catalog);
    return { ...settings, items: s.scenario.items, delivery: s.scenario.delivery, config: s.scenario.shipping };
  };
  const scenarioLabel = (s) => s.scenario.name;

  const checks = [
    // ---- T3 general.js
    {
      id: 'tep_round', module: 'general', title: 'tep_round() — general.php:305', cases: fn('tep_round'),
      label: (c) => `tepRound(${JSON.stringify(c.args[0])}, ${c.args[1]})`,
      run: (c) => numberCheck(domain.general.tepRound(c.args[0], c.args[1]), c.expected),
    },
    // ---- T4 tax.js
    {
      id: 'tax_rate', module: 'tax', title: 'tep_get_tax_rate() — general.php:328', cases: fn('tax_rate'),
      label: (c) => `getTaxRate(catalog, class ${c.args[0]}, country ${c.args[1]}, zone ${c.args[2]})`,
      run: (c) => numberCheck(domain.tax.getTaxRate(catalog, c.args[0], c.args[1], c.args[2]), c.expected),
    },
    {
      id: 'tax_description', module: 'tax', title: 'tep_get_tax_description() — general.php:362', cases: fn('tax_description'),
      label: (c) => `getTaxDescription(catalog, class ${c.args[0]}, country ${c.args[1]}, zone ${c.args[2]})`,
      run: (c) => stringCheck(domain.tax.getTaxDescription(catalog, c.args[0], c.args[1], c.args[2]), c.expected),
    },
    {
      id: 'add_tax', module: 'tax', title: 'tep_add_tax() — general.php:385', cases: fn('add_tax'),
      label: (c) => `addTax(${JSON.stringify(c.args[0])}, ${c.args[1]}, displayPriceWithTax=${c.displayPriceWithTax})`,
      run: (c) => numberCheck(domain.tax.addTax(c.args[0], c.args[1], c.displayPriceWithTax), c.expected),
    },
    {
      id: 'calculate_tax', module: 'tax', title: 'tep_calculate_tax() — general.php:394', cases: fn('calculate_tax'),
      label: (c) => `calculateTax(${JSON.stringify(c.args[0])}, ${c.args[1]})`,
      run: (c) => numberCheck(domain.tax.calculateTax(c.args[0], c.args[1]), c.expected),
    },
    {
      id: 'inclusive_tax', module: 'tax', title: 'tax-inclusive back-out — order.php:318', cases: fn('inclusive_tax'),
      label: (c) => `inclusiveTaxPortion(${c.args[0]}, ${c.args[1]})`,
      run: (c) => numberCheck(domain.tax.inclusiveTaxPortion(c.args[0], c.args[1]), c.expected),
    },
    // ---- T5 currency.js
    {
      id: 'calculate_price', module: 'currency', title: 'currencies::calculate_price() — currencies.php:50', cases: fn('calculate_price'),
      label: (c) => `calculatePrice(${JSON.stringify(c.args[0])}, ${c.args[1]}, ${c.args[2]}, {${c.args[3]}, displayPriceWithTax=${c.displayPriceWithTax}})`,
      run: (c) => numberCheck(
        domain.currency.calculatePrice(c.args[0], c.args[1], c.args[2], { displayPriceWithTax: c.displayPriceWithTax, currency: currency(c.args[3]) }),
        c.expected,
      ),
    },
    {
      id: 'format', module: 'currency', title: 'currencies::format() — currencies.php:35', cases: fn('format'),
      label: (c) => `format(${c.args[0]}, ${c.args[1]}, applyRate=${c.args[2]}, rateOverride=${JSON.stringify(c.args[3])})`,
      run: (c) => stringCheck(domain.currency.format(c.args[0], currency(c.args[1]), c.args[2], c.args[3]), c.expected),
    },
    // ---- T6 cart.js
    {
      id: 'cart_calculate', module: 'cart', title: 'shoppingCart::calculate() — shopping_cart.php:261', cases: fn('cart_calculate'),
      label: (c) => `calculateCart(${JSON.stringify(c.args[1])}, {${c.args[0]}, displayPriceWithTax=${c.displayPriceWithTax}})`,
      run: (c) => diff(
        domain.cart.calculateCart(c.args[1], catalog, { displayPriceWithTax: c.displayPriceWithTax, currency: currency(c.args[0]) }),
        c.expected,
      ),
    },
    {
      id: 'scenario_cart', module: 'cart', title: 'cart stage of every checkout scenario', cases: scenarios, label: scenarioLabel,
      run: (s) => {
        const x = ctxFor(s);
        return diff(domain.cart.calculateCart(x.items, catalog, x.pricing), s.expected.cart, '$.cart');
      },
    },
    // ---- T7 order.js
    {
      id: 'scenario_order', module: 'order', title: 'order::cart() before and after shipping is chosen — order.php:133', cases: scenarios, label: scenarioLabel,
      run: (s) => {
        const x = ctxFor(s);
        const first = domain.order.buildOrder(x.items, catalog, { pricing: x.pricing, delivery: x.delivery, shipping: null });
        const second = domain.order.buildOrder(x.items, catalog, { pricing: x.pricing, delivery: x.delivery, shipping: s.expected.exact.selectedShipping });
        return [
          ...diff(first.products, s.expected.products, '$.products'),
          ...diff(first.info, s.expected.orderBeforeShipping, '$.orderBeforeShipping'),
          ...diff(second.info, s.expected.orderBeforeTotals, '$.orderBeforeTotals'),
        ];
      },
    },
    // ---- T8 shipping/
    {
      id: 'scenario_shipping', module: 'shipping', title: 'box weights, free-shipping offer, module quote, selection — shipping.php, flat/item/table.php, checkout_shipping.php', cases: scenarios, label: scenarioLabel,
      run: (s) => {
        const x = ctxFor(s);
        const cart = domain.cart.calculateCart(x.items, catalog, x.pricing);
        const order = domain.order.buildOrder(x.items, catalog, { pricing: x.pricing, delivery: x.delivery, shipping: null });
        const shipment = domain.shipping.prepareShipment(cart.weight, x.shippingBox);
        const free = domain.shipping.isFreeShippingOffered(order, x.freeShipping, catalog.store.countryId);
        const module = domain.pipeline.SHIPPING_MODULES[x.config.module];
        const quote = module.quote({ order, cartTotal: cart.total, cartCount: cart.count, shipment, config: x.config, catalog });
        const selected = domain.shipping.selectShipping(quote, free);
        return [
          ...diff(shipment, s.expected.shipment, '$.shipment'),
          ...diff(free, s.expected.freeShippingOffered, '$.freeShippingOffered'),
          ...diff(quote, s.expected.quote, '$.quote'),
          ...diff(selected, s.expected.selectedShipping, '$.selectedShipping'),
        ];
      },
    },
    // ---- T9 orderTotals/
    {
      id: 'scenario_order_totals', module: 'ot', title: 'order_total::process() with ot_subtotal/shipping/tax/total — order_total.php:34', cases: scenarios, label: scenarioLabel,
      run: (s) => {
        const x = ctxFor(s);
        const order = domain.order.buildOrder(x.items, catalog, { pricing: x.pricing, delivery: x.delivery, shipping: s.expected.exact.selectedShipping });
        const lines = domain.orderTotals.processAll(order, {
          catalog,
          displayPriceWithTax: x.pricing.displayPriceWithTax,
          currency: x.pricing.currency,
          freeShipping: x.freeShipping,
          storeCountryId: catalog.store.countryId,
          selectedShipping: s.expected.exact.selectedShipping,
          installedShippingTaxClasses: { [x.config.module]: x.config.taxClassId || 0 },
        });
        return [
          ...diff(lines, s.expected.orderTotals, '$.orderTotals'),
          ...diff(order.info, s.expected.orderAfterTotals, '$.orderAfterTotals'),
        ];
      },
    },
    // ---- everything, end to end through the provided pipeline
    {
      id: 'scenario_pipeline', module: 'pipeline', title: 'full checkout (domain/index.js checkoutTotals) vs. legacy page flow', cases: scenarios, label: scenarioLabel,
      run: (s) => diff(domain.pipeline.checkoutTotals(s.scenario, catalog), s.expected),
    },
  ];

  const taskOf = Object.fromEntries(MODULES.map((m) => [m.module, m.task]));
  return checks.map((c) => ({ ...c, task: taskOf[c.module] }));
}

/**
 * Run one check over all its cases.
 * @returns {{id, module, task, title, total, passed, failed, notImplemented: (string|null), failures: Array<{label, problems}>}}
 */
function runCheck(check, { maxFailures = 5 } = {}) {
  const result = {
    id: check.id, module: check.module, task: check.task, title: check.title,
    total: check.cases.length, passed: 0, failed: 0, notImplemented: null, failures: [],
  };
  for (const c of check.cases) {
    let problems;
    try {
      problems = check.run(c);
    } catch (err) {
      if (err instanceof NotImplemented) {
        result.notImplemented = err.message;
        result.failed = result.total - result.passed;
        return result;
      }
      problems = [`threw ${err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : err}`];
    }
    if (problems.length === 0) {
      result.passed += 1;
    } else {
      result.failed += 1;
      if (result.failures.length < maxFailures) result.failures.push({ label: check.label(c), problems: problems.slice(0, 8) });
    }
  }
  return result;
}

function runAll(options = {}) {
  return buildChecks(options.goldenDir).map((c) => runCheck(c, options));
}

module.exports = { MODULES, DEFAULT_GOLDEN_DIR, buildChecks, runCheck, runAll };
