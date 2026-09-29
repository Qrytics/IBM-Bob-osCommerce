'use strict';

/**
 * cart.js: legacy-baseline/catalog/includes/classes/shopping_cart.php
 *
 * OWNER: Bob, task T6 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:cart
 *
 * Rules: BR-09, BR-10, BR-11, BR-12 (plus Q-04, Q-05, Q-08)
 *
 * The legacy class queried `products`, `specials` and `products_attributes`
 * with SQL. Here those tables are arrays on `catalog`; `(int)` casts and
 * "first matching row" semantics still apply.
 */

const { phpToNumber } = require('./phpNumber');
const { tepGetUprid } = require('./general');
const { getTaxRate } = require('./tax');
const { calculatePrice } = require('./currency');

/**
 * Look up a product row from catalog by productId (first matching row,
 * replicating SELECT ... WHERE products_id = (int)$id).
 * @param {import('./types').Catalog} catalog
 * @param {number} productId
 * @returns {Object|undefined}
 */
function findProduct(catalog, productId) {
  const id = Math.trunc(phpToNumber(productId));
  return catalog.products.find((p) => p.products_id === id);
}

/**
 * Look up the special price for a product (status = '1'), replicating
 * shopping_cart.php line 280: SELECT ... WHERE products_id = (int)$prid AND status = '1'.
 * Q-08: expiry date is never checked.
 * @param {import('./types').Catalog} catalog
 * @param {number} prid
 * @returns {string|null} specials_new_products_price or null
 */
function findSpecial(catalog, prid) {
  const id = Math.trunc(phpToNumber(prid));
  const row = catalog.specials.find((s) => s.products_id === id && s.status === '1');
  return row ? row.specials_new_products_price : null;
}

/**
 * shoppingCart::attributes_price($products_id): shopping_cart.php lines 306-323.
 *
 * Sum of the attribute prices ('+' adds, anything else subtracts), unrounded, untaxed.
 * Uses phpToNumber to replicate PHP's implicit string → float coercion on options_values_price.
 *
 * BR-11: attributes_price accumulates +/- attribute deltas.
 *
 * @param {import('./types').CartItem} item
 * @param {import('./types').Catalog} catalog
 * @returns {number}
 */
function attributesPrice(item, catalog) {
  let price = 0;
  const prid = Math.trunc(phpToNumber(item.productId));

  for (const attr of item.attributes) {
    const optionId = Math.trunc(phpToNumber(attr.optionId));
    const valueId = Math.trunc(phpToNumber(attr.valueId));

    // SELECT options_values_price, price_prefix FROM products_attributes
    // WHERE products_id = (int)$prid AND options_id = (int)$option AND options_values_id = (int)$value
    const row = catalog.products_attributes.find(
      (a) =>
        a.products_id === prid &&
        a.options_id === optionId &&
        a.options_values_id === valueId
    );

    if (row) {
      if (row.price_prefix === '+') {
        price += phpToNumber(row.options_values_price);
      } else {
        price -= phpToNumber(row.options_values_price);
      }
    }
  }

  return price;
}

/**
 * shoppingCart::get_products(): shopping_cart.php lines 325-358.
 *
 * Builds the product list with uprid, name, model, price (possibly special),
 * quantity, weight, final_price (price + attributes_price), taxClassId, attributes.
 *
 * BR-12: getProducts returns the catalog data enriched with special prices.
 *
 * @param {Array<import('./types').CartItem>} items
 * @param {import('./types').Catalog} catalog
 * @returns {Array<import('./types').CartProduct>}
 */
function getProducts(items, catalog) {
  const langId = catalog.store.languageId;
  const result = [];

  for (const item of items) {
    const product = findProduct(catalog, item.productId);
    if (!product) continue;

    const prid = product.products_id;

    // The uprid key: tepGetUprid builds "prid{opt}val..." string
    const uprid = tepGetUprid(prid, item.attributes);

    // Check for special price (Q-08: no expiry check)
    const special = findSpecial(catalog, prid);
    const price = special !== null ? special : product.products_price;

    // products_name from products_description (keyed by language)
    const descRow = catalog.products_description
      ? catalog.products_description.find(
          (d) => d.products_id === prid && d.language_id === langId
        )
      : null;
    const name = descRow ? descRow.products_name : product.products_name || '';

    result.push({
      id: uprid,
      productId: prid,
      name,
      model: product.products_model,
      price,
      quantity: item.qty,
      weight: product.products_weight,
      finalPrice: phpToNumber(price) + attributesPrice(item, catalog),
      taxClassId: product.products_tax_class_id,
      attributes: item.attributes,
    });
  }

  return result;
}

/**
 * shoppingCart::calculate(), plus count_contents(): shopping_cart.php lines 261-304 and 203-213.
 *
 * For each item:
 *   - Look up tax rate using STORE location (Q-05: no delivery address at cart stage).
 *   - Add calculatePrice(products_price, tax, qty) to total.
 *   - For each attribute: add/subtract calculatePrice(attr_price, tax, qty) (Q-04: each rounded separately).
 *   - Accumulate weight: qty * products_weight.
 * count: sum of all quantities.
 *
 * BR-09: total is sum of calculate_price for product + each attribute separately.
 * BR-10: weight is qty × products_weight summed over items.
 * Q-04: product and attribute prices are rounded separately (per legacy).
 * Q-05: tax rate uses store location (countryId/zoneId from catalog.store).
 *
 * @param {Array<import('./types').CartItem>} items
 * @param {import('./types').Catalog} catalog
 * @param {import('./types').PricingContext} ctx
 * @returns {import('./types').CartTotals}
 */
function calculateCart(items, catalog, ctx) {
  let total = 0;
  let weight = 0;
  let count = 0;

  // Q-05: tax uses store location (no customer session at cart stage)
  const storeCountryId = catalog.store.countryId;
  const storeZoneId = catalog.store.zoneId;

  for (const item of items) {
    const qty = item.qty;
    const product = findProduct(catalog, item.productId);
    if (!product) continue;

    const prid = product.products_id;

    // tep_get_tax_rate($product['products_tax_class_id']) — store location fallback
    const tax = getTaxRate(catalog, product.products_tax_class_id, storeCountryId, storeZoneId);

    // Special price check (Q-08: status=1, no expiry)
    const special = findSpecial(catalog, prid);
    const productsPrice = special !== null ? special : product.products_price;

    // Product price line (shopping_cart.php line 286)
    total += calculatePrice(productsPrice, tax, qty, ctx);

    // Weight (line 287): qty * products_weight (phpToNumber for DB string)
    weight += qty * phpToNumber(product.products_weight);

    // count_contents: sum of qtys
    count += qty;

    // Attribute price lines (lines 291-301)
    for (const attr of item.attributes) {
      const optionId = Math.trunc(phpToNumber(attr.optionId));
      const valueId = Math.trunc(phpToNumber(attr.valueId));

      const attrRow = catalog.products_attributes.find(
        (a) =>
          a.products_id === prid &&
          a.options_id === optionId &&
          a.options_values_id === valueId
      );

      if (attrRow) {
        if (attrRow.price_prefix === '+') {
          total += calculatePrice(attrRow.options_values_price, tax, qty, ctx);
        } else {
          total -= calculatePrice(attrRow.options_values_price, tax, qty, ctx);
        }
      }
    }
  }

  return { total, weight, count };
}

module.exports = { calculateCart, attributesPrice, getProducts };
