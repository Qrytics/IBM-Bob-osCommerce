#!/usr/bin/env node
// Generate golden fixtures by running the REAL osCommerce v2.3.4 code (PHP 7.4).
//
//   node scripts/golden/generate.mjs                      # rewrite fixtures/golden (committed)
//   node scripts/golden/generate.mjs --seed 123 --out .holdout --random-scenarios 40
//                                                         # fresh random hold-out set
//
// Cases are built here (seeded, deterministic). PHP only evaluates them, so the
// same seed always produces byte-identical files.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, resolvePhp, runPhp } from './php.mjs';

const argv = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? dflt : argv[i + 1];
};
const SEED = Number(opt('seed', 20260929));
const OUT = path.resolve(REPO_ROOT, opt('out', 'fixtures/golden'));
const RANDOM_SCENARIOS = Number(opt('random-scenarios', 20));
const INCLUDE_CURATED = !argv.includes('--no-curated');
const WORK = path.join(REPO_ROOT, '.golden-work');

const catalog = JSON.parse(readFileSync(path.join(REPO_ROOT, 'fixtures/catalog.json'), 'utf8'));

// ---------------------------------------------------------------- PRNG ----
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const money = (max, decimals) => Number((rnd() * max).toFixed(decimals));
const dbDecimal = (max) => (rnd() * max).toFixed(4); // DB decimal(15,4) as a string

// ------------------------------------------------------- reference data ---
const CURRENCIES = catalog.currencies.map((c) => c.code);
const LOCATIONS = [
  [223, 18], [223, 12], [223, 43], [38, 74], [38, 76], [81, 79], [81, 81], [81, 0], [222, 0], [223, 0],
];
const TAX_CLASSES = [0, 1, 2, 3, 99];
const compound = (...rates) => (rates.reduce((m, r) => m * (1 + r / 100), 1) - 1) * 100;
const TAX_RATES = [0, 2.5, 4, 5, 7, 8.5, 9.975, 10, 13, 19, 20, 99.5, 100, 150, 0.5, 0.05, 12.25,
  compound(5, 9.975), compound(7, 2.5), compound(4.5, 4), 7.0000001];

function attributeChoices(productId) {
  const byOption = new Map();
  for (const a of catalog.products_attributes) {
    if (a.products_id !== productId) continue;
    if (!byOption.has(a.options_id)) byOption.set(a.options_id, []);
    byOption.get(a.options_id).push(a.options_values_id);
  }
  return byOption;
}

function randomItems(maxLines = 4) {
  const items = [];
  const seen = new Set();
  const lines = int(1, maxLines);
  for (let i = 0; i < lines; i++) {
    const p = pick(catalog.products);
    const attributes = [];
    const options = [...attributeChoices(p.products_id).entries()];
    // shuffle option order: legacy iterates attributes in insertion order
    options.sort(() => rnd() - 0.5);
    for (const [optionId, values] of options) {
      if (rnd() < 0.8) attributes.push({ optionId, valueId: pick(values) });
    }
    const key = p.products_id + JSON.stringify(attributes);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ productId: p.products_id, qty: pick([1, 1, 1, 2, 3, 5, 7, 12, 25]), attributes });
  }
  return items;
}

// -------------------------------------------------------- function cases ---
function functionCases() {
  const tepRound = [
    [1.005, 2], [2.675, 2], [1.955, 2], [0.285, 2], [1.45, 1], [2.5, 0], [3.5, 0], [0.5, 0], [1.994999, 2],
    ['10.0050', 2], ['19.9950', 2], ['299.9900', 2], ['0.0000', 2], ['1.2345', 3], ['1.2344', 3], ['49.99', 2],
    [10.70535, 2], [42.7893, 2], [53.4893, 2], [0.1 + 0.2, 2], [1 / 3, 4], [2 / 3, 2], [99.995, 2], [9.995, 2],
    [123456.785, 2], [1e-5, 2], [0.00001, 4], [1e15 + 0.3, 2], [123456789012.345, 2], [5, 2], [0, 2], [100, 0],
    [-1.005, 2], [-2.675, 2], [-0.5, 0], ['-10.0050', 2], [1.9999, 3], [0.9999, 2], [0.995, 2], [7.0000001, 2],
    [52.0735, 2], [34.9993, 2], [1.0725, 2], [64.95 * 1.07, 2], [69.99 * 1.19, 2], [749.99 * 1.13, 2],
  ];
  for (let i = 0; i < 400; i++) {
    const v = pick([
      () => money(1000, int(1, 8)),
      () => Number(dbDecimal(500)) * (1 + pick(TAX_RATES) / 100),
      () => dbDecimal(1000),
      () => money(10, 3) + 0.005,
      () => int(0, 100000) / pick([8, 16, 3, 7, 1000]),
    ])();
    tepRound.push([v, pick([0, 1, 2, 2, 2, 3, 4])]);
  }

  const taxRate = [];
  for (const cls of TAX_CLASSES) for (const [c, z] of LOCATIONS) taxRate.push([cls, c, z]);

  const addTax = [];
  const calculateTax = [];
  for (let i = 0; i < 120; i++) {
    const price = pick([() => dbDecimal(1000), () => money(1000, 4), () => money(5, 2)])();
    const tax = pick(TAX_RATES);
    addTax.push([price, tax]);
    calculateTax.push([price, tax]);
  }
  addTax.push(['0.0000', 7], ['10.0000', 0], [-5, 7], ['15.0000', -1]);

  const inclusiveTax = [];
  for (const tax of TAX_RATES) inclusiveTax.push([100, tax], [42.79, tax], [0, tax]);
  for (let i = 0; i < 120; i++) inclusiveTax.push([money(3000, 2), pick(TAX_RATES)]);

  const calculatePrice = [];
  for (let i = 0; i < 250; i++) {
    calculatePrice.push([
      pick([() => dbDecimal(1000), () => money(100, 4), () => pick(['10.0050', '19.9950', '2.4950', '1.3333'])])(),
      pick(TAX_RATES), pick([1, 1, 2, 3, 7, 10, 25, 100]), pick(CURRENCIES),
    ]);
  }

  const format = [];
  const fmtNumbers = [0, 1, 5, 42.79, 1010.7679, 1234567.891, 999.995, 0.005, 1.005, 65.7979, -12.345, 1e9, 0.1 + 0.2];
  for (const n of fmtNumbers) for (const cur of CURRENCIES) {
    format.push([n, cur, true, null], [n, cur, false, null], [n, cur, true, '1.2345']);
  }
  for (let i = 0; i < 150; i++) {
    format.push([money(pick([10, 1000, 100000]), int(0, 6)), pick(CURRENCIES), rnd() < 0.8, pick([null, null, '', '0.5', '2'])]);
  }

  const cartCalculate = [];
  for (let i = 0; i < 80; i++) cartCalculate.push([pick(CURRENCIES), randomItems(5)]);
  cartCalculate.push(['USD', []]);

  const phpFloat = [0.1 + 0.2, 1 / 3, 2 / 3, 1e14, 1e15, 1e16, 123456789012345.67, 1e-4, 1e-5, 0.00012345, 1.5e-7,
    100, 7, 12.35, compound(5, 9.975), compound(7, 2.5), 65.7979, 1010.7679000000001, 99999999999999.99,
    -0.5, -1e-5, 5e-324, 1.7976931348623157e308, 0.30000000000000004, 1234.5, 12345678901234.5];
  for (let i = 0; i < 200; i++) {
    phpFloat.push(pick([
      () => rnd() * 10 ** int(-8, 18),
      () => money(1000, 2) * (1 + pick(TAX_RATES) / 100),
      () => -rnd() * 10 ** int(-3, 6),
    ])());
  }

  const phpToNumber = ['299.9900', '1.07', '1.0725', '1.1547375', '1.01.0E-5', '', 'abc', ' 5', '5 ', '1e3', '0x1A',
    '.5', '-.5e1', '1.', '1.100', '007', '1.0', '12abc', '  -3.25xyz', '1E+20', '1.0E-5'].map((s) => [s]);

  const numberFormat = [];
  const nfNumbers = [1234.5, 0.125, 1.005, 2.675, 1.955, -1234.567, 1e6, 999.995, 0.285, 1.45, 0, -0.004, 1234567.891,
    10.7, 42.79, 100, 5e-7, 1e15, 0.5, 1.5, 2.5, -2.5];
  for (const n of nfNumbers) {
    for (const d of [0, 1, 2, 3]) numberFormat.push([n, d, '.', ','], [n, d, ',', '.']);
  }
  for (let i = 0; i < 150; i++) {
    numberFormat.push([pick([() => money(100000, int(0, 5)), () => rnd() * 1000, () => -money(5000, 3)])(), int(0, 4), pick(['.', ',']), pick([',', '.', ' ', ''])]);
  }

  const modeIndependent = {
    tep_round: tepRound,
    tax_rate: taxRate,
    tax_description: taxRate,
    calculate_tax: calculateTax,
    inclusive_tax: inclusiveTax,
    format,
    php_float_to_string: phpFloat.map((n) => [n]),
    php_to_number: phpToNumber,
    php_number_format: numberFormat,
  };
  const modeDependent = { add_tax: addTax, calculate_price: calculatePrice, cart_calculate: cartCalculate };
  return { modeIndependent, modeDependent };
}

// ------------------------------------------------------- random scenarios ---
function randomScenario(i) {
  const [countryId, zoneId] = pick(LOCATIONS.filter(([, z]) => z !== 0 || rnd() < 0.3));
  const module = pick(['flat', 'item', 'table']);
  const shipping = { module, taxClassId: pick([0, 0, 1, 3]) };
  if (module === 'flat') shipping.cost = money(20, 2).toFixed(2);
  if (module === 'item') Object.assign(shipping, { cost: money(5, 2).toFixed(2), handling: money(3, 2).toFixed(2) });
  if (module === 'table') {
    Object.assign(shipping, {
      mode: pick(['weight', 'price']),
      table: pick(['25:8.50,50:5.50,10000:0.00', '10:4.99,30:9.99,100:19.99,99999:49.99', '100:12.00,500:6.00,99999:0']),
      handling: pick(['0', '1.50']),
    });
  }
  const settings = {
    displayPriceWithTax: rnd() < 0.5,
    currency: pick(CURRENCIES),
    shippingBox: { weight: pick(['3', '0', '5']), padding: pick(['10', '0', '25']), maxWeight: pick(['50', '20', '100']) },
  };
  if (rnd() < 0.4) {
    settings.freeShipping = { enabled: true, over: pick(['50', '100', '250', '1000']), destination: pick(['national', 'international', 'both']) };
  }
  return {
    name: `random-${String(SEED)}-${String(i).padStart(3, '0')}`,
    description: `Randomly generated scenario (seed ${SEED}, #${i}).`,
    settings,
    delivery: { countryId, zoneId },
    shipping,
    items: randomItems(4),
  };
}

// ------------------------------------------------------------------ main ---
function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

const php = resolvePhp();
const meta = {
  generator: 'scripts/golden/generate.mjs',
  legacy: 'osCommerce v2.3.4 (329d51a), legacy-baseline/catalog',
  php: '7.4',
  seed: SEED,
};
console.log(`Using PHP ${php.version} via ${path.basename(php.cmd)}; seed ${SEED}; out ${path.relative(REPO_ROOT, OUT) || '.'}`);

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
rmSync(path.join(OUT, 'functions'), { recursive: true, force: true });
rmSync(path.join(OUT, 'scenarios'), { recursive: true, force: true });

// function-level fixtures
const { modeIndependent, modeDependent } = functionCases();
writeJson(path.join(WORK, 'cases-independent.json'), modeIndependent);
writeJson(path.join(WORK, 'cases-dependent.json'), modeDependent);
const independent = runPhp('legacy-harness/bin/run-functions.php', [path.join(WORK, 'cases-independent.json'), 'false']);
const withTax = runPhp('legacy-harness/bin/run-functions.php', [path.join(WORK, 'cases-dependent.json'), 'true']);
const withoutTax = runPhp('legacy-harness/bin/run-functions.php', [path.join(WORK, 'cases-dependent.json'), 'false']);

for (const [group, cases] of Object.entries(independent)) {
  writeJson(path.join(OUT, 'functions', `${group}.json`), { _meta: meta, cases });
}
for (const group of Object.keys(modeDependent)) {
  const cases = [
    ...withoutTax[group].map((c) => ({ displayPriceWithTax: false, ...c })),
    ...withTax[group].map((c) => ({ displayPriceWithTax: true, ...c })),
  ];
  writeJson(path.join(OUT, 'functions', `${group}.json`), { _meta: meta, cases });
}
console.log(`  functions: ${Object.keys(independent).length + Object.keys(modeDependent).length} groups`);

// scenario-level fixtures
const scenarios = [];
if (INCLUDE_CURATED) {
  const dir = path.join(REPO_ROOT, 'legacy-harness/scenarios');
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    scenarios.push(JSON.parse(readFileSync(path.join(dir, f), 'utf8')));
  }
}
for (let i = 1; i <= RANDOM_SCENARIOS; i++) scenarios.push(randomScenario(i));

for (const scenario of scenarios) {
  const file = path.join(WORK, `scenario-${scenario.name}.json`);
  writeJson(file, scenario);
  const expected = runPhp('legacy-harness/bin/run-scenario.php', [file]);
  writeJson(path.join(OUT, 'scenarios', `${scenario.name}.json`), { _meta: { ...meta, seed: scenario.name.startsWith('random-') ? SEED : null }, scenario, expected });
}
console.log(`  scenarios: ${scenarios.length}`);

rmSync(WORK, { recursive: true, force: true });
