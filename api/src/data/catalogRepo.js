'use strict';

/**
 * Read-only data access (PROVIDED, LOCKED).
 *
 * The legacy storefront queried MySQL. The modern service keeps the same data
 * in fixtures/catalog.json (the demo store) and fixtures/golden (legacy
 * outputs), behind this small interface, so a real database can replace it
 * later without touching the domain layer.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CATALOG_PATH = process.env.CATALOG_PATH || path.join(REPO_ROOT, 'fixtures/catalog.json');
const SCENARIO_DIR = path.join(REPO_ROOT, 'fixtures/golden/scenarios');

let catalog;
let scenarios;

function deepFreeze(o) {
  Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(o);
}

/** @returns {import('../domain/types').Catalog} */
function getCatalog() {
  if (!catalog) catalog = deepFreeze(JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')));
  return catalog;
}

const nameOf = (rows, idKey, id, nameKey) => {
  const row = rows.find((r) => r[idKey] === id && r.language_id === getCatalog().store.languageId);
  return row ? row[nameKey] : null;
};

/** Product with its active special and selectable options, for listings. */
function describeProduct(p) {
  const c = getCatalog();
  const special = c.specials.find((s) => s.products_id === p.products_id && String(s.status) === '1');
  const options = [];
  for (const a of c.products_attributes.filter((x) => x.products_id === p.products_id)) {
    let opt = options.find((o) => o.optionId === a.options_id);
    if (!opt) {
      opt = { optionId: a.options_id, name: nameOf(c.products_options, 'products_options_id', a.options_id, 'products_options_name'), values: [] };
      options.push(opt);
    }
    opt.values.push({
      valueId: a.options_values_id,
      name: nameOf(c.products_options_values, 'products_options_values_id', a.options_values_id, 'products_options_values_name'),
      pricePrefix: a.price_prefix,
      price: a.options_values_price,
    });
  }
  return {
    id: p.products_id,
    name: p.products_name,
    model: p.products_model,
    price: p.products_price,
    specialPrice: special ? special.specials_new_products_price : null,
    weight: p.products_weight,
    taxClassId: p.products_tax_class_id,
    options,
  };
}

function listProducts() {
  return getCatalog().products.map(describeProduct);
}

function getProduct(id) {
  const p = getCatalog().products.find((x) => x.products_id === id);
  return p ? describeProduct(p) : null;
}

function reference() {
  const c = getCatalog();
  return {
    store: c.store,
    currencies: c.currencies.map(({ code, title, symbol_left: symbolLeft, symbol_right: symbolRight, decimal_places: decimalPlaces, value }) => ({ code, title, symbolLeft, symbolRight, decimalPlaces, value })),
    countries: c.countries.map((x) => ({ id: x.countries_id, name: x.countries_name, isoCode2: x.countries_iso_code_2 })),
    zones: c.zones.map((z) => ({ id: z.zone_id, countryId: z.zone_country_id, code: z.zone_code, name: z.zone_name })),
    taxClasses: c.tax_class.map((t) => ({ id: t.tax_class_id, title: t.tax_class_title })),
  };
}

/** Golden legacy scenarios: [{ scenario, expected }], sorted by name. */
function getScenarios() {
  if (!scenarios) {
    scenarios = fs.existsSync(SCENARIO_DIR)
      ? fs.readdirSync(SCENARIO_DIR).filter((f) => f.endsWith('.json')).sort()
        .map((f) => deepFreeze(JSON.parse(fs.readFileSync(path.join(SCENARIO_DIR, f), 'utf8'))))
      : [];
  }
  return scenarios;
}

function getScenario(name) {
  return getScenarios().find((s) => s.scenario.name === name) || null;
}

module.exports = { getCatalog, listProducts, getProduct, reference, getScenarios, getScenario };
