'use strict';

/**
 * order.js: order::cart() in legacy-baseline/catalog/includes/classes/order.php
 *
 * OWNER: Bob, task T7 (BOB_TASKS.md). Mode: 🔁 CleanCart Translator.
 * CHECK: npm run check:order
 *
 * Rules: BR-13, BR-14, BR-15, BR-16, BR-17 (plus Q-04, Q-06, Q-09)
 */

const { phpToNumber } = require('./phpNumber');
const { getTaxRate, getTaxDescription, inclusiveTaxPortion } = require('./tax');
const { calculatePrice } = require('./currency');
const { getProducts, attributesPrice } = require('./cart');
const { tepGetUprid } = require('./general');

/**
 * order::cart(): order.php lines 281-341.
 *
 * The order is built for a guest whose delivery address is `delivery`. Product tax
 * uses the delivery location (BR-14). Customer/billing address lookups are not
 * part of the slice.
 *
 * info starts as:
 *   { currency: currency.code, currencyValue: currency.value,
 *     shippingMethod: shipping.title  ('' when shipping is null),
 *     shippingCost:   shipping.cost   (0 when shipping is null),
 *     subtotal: 0, tax: 0, taxGroups: [], total }
 * taxGroups is an array of { description, amount } in first-seen order, which
 * mirrors the PHP associative array $this->info['tax_groups'].
 *
 * BR-13: order builds products array with delivery-location tax.
 * BR-14: tax rate uses delivery countryId / zoneId (not store location).
 * BR-15: total = subtotal + shippingCost (inclusive) or subtotal + tax + shippingCost (exclusive).
 * BR-16: inclusive tax portion uses the string-concatenation divisor (Q-06).
 * BR-17: tax_groups accumulates in first-seen insertion order (Q-09).
 * Q-04: final_price uses combined price+attrs (different from cart's per-line rounding).
 * Q-09: untaxed products produce a 0-amount "Unknown tax rate" group.
 *
 * @param {Array<import('./types').CartItem>} items
 * @param {import('./types').Catalog} catalog
 * @param {{pricing: import('./types').PricingContext, delivery: import('./types').Location, shipping: (import('./types').ShippingSelection|null)}} ctx
 * @returns {import('./types').Order}  contentType is always 'physical'
 */
function buildOrder(items, catalog, ctx) {
  const { pricing, delivery, shipping } = ctx;
  const currency = pricing.currency;
  const displayPriceWithTax = pricing.displayPriceWithTax;

  // tax_address: delivery country + zone (order.php line 210-212)
  const deliveryCountryId = delivery.countryId;
  const deliveryZoneId = delivery.zoneId;

  // $this->info initialisation (order.php line 214-227)
  const info = {
    currency: currency.code,
    currencyValue: currency.value,
    shippingMethod: shipping ? shipping.title : '',
    shippingCost: shipping ? shipping.cost : 0,
    subtotal: 0,
    tax: 0,
    taxGroups: [], // array of { description, amount } in insertion order
    total: 0,
  };

  // tax_groups as a Map to maintain insertion order and allow += semantics
  const taxGroupMap = new Map();

  // get_products() — calls cart's getProducts for the same data (order.php line 282)
  const cartProducts = getProducts(items, catalog);
  const langId = catalog.store.languageId;

  const orderProducts = [];

  for (const cp of cartProducts) {
    // tep_get_tax_rate with delivery location (order.php line 287)
    const tax = getTaxRate(catalog, cp.taxClassId, deliveryCountryId, deliveryZoneId);
    const taxDescription = getTaxDescription(catalog, cp.taxClassId, deliveryCountryId, deliveryZoneId);

    // final_price: price + attributes_price($products_id) (order.php line 290)
    // Match the CartItem to this cart product by comparing UPRIDs.
    const cartItem = items.find((it) => tepGetUprid(it.productId, it.attributes) === cp.id);
    const attrPrice = cartItem ? attributesPrice(cartItem, catalog) : 0;
    const finalPrice = phpToNumber(cp.price) + attrPrice;

    // Build attributes array for order product (order.php lines 294-310)
    const orderAttrs = [];
    if (cartItem && cartItem.attributes.length > 0) {
      for (const attr of cartItem.attributes) {
        const optionId = Math.trunc(phpToNumber(attr.optionId));
        const valueId = Math.trunc(phpToNumber(attr.valueId));

        // products_id for attribute lookup: (int)$products[$i]['id'] where id is the uprid
        // PHP (int) of a string like "1{4}2" = 1 (leading digits)
        const productIdInt = Math.trunc(phpToNumber(cp.id));

        const paRow = catalog.products_attributes.find(
          (a) =>
            a.products_id === productIdInt &&
            a.options_id === optionId &&
            a.options_values_id === valueId
        );

        const optRow = catalog.products_options
          ? catalog.products_options.find(
              (o) => o.products_options_id === optionId && o.language_id === langId
            )
          : null;
        const valRow = catalog.products_options_values
          ? catalog.products_options_values.find(
              (v) => v.products_options_values_id === valueId && v.language_id === langId
            )
          : null;

        orderAttrs.push({
          optionId,
          valueId,
          optionName: optRow ? optRow.products_options_name : '',
          valueName: valRow ? valRow.products_options_values_name : '',
          prefix: paRow ? paRow.price_prefix : '',
          price: paRow ? paRow.options_values_price : '0',
        });
      }
    }

    const orderProduct = {
      id: cp.id,
      qty: cp.quantity,
      name: cp.name,
      model: cp.model,
      price: cp.price,
      finalPrice,
      weight: cp.weight,
      tax,
      taxDescription,
      attributes: orderAttrs,
    };

    orderProducts.push(orderProduct);

    // shown_price = calculate_price(final_price, tax, qty) (order.php line 312)
    const shownPrice = calculatePrice(finalPrice, tax, cp.quantity, pricing);
    info.subtotal += shownPrice;

    // Tax accumulation (order.php lines 317-331)
    let taxAmount;
    if (displayPriceWithTax) {
      // inclusive: tax portion back-out (Q-06)
      taxAmount = inclusiveTaxPortion(shownPrice, tax);
    } else {
      // exclusive: (tax/100) * shown_price
      taxAmount = (tax / 100) * shownPrice;
    }

    info.tax += taxAmount;

    // tax_groups: PHP associative array — first-seen insertion order (Q-09)
    if (taxGroupMap.has(taxDescription)) {
      taxGroupMap.set(taxDescription, taxGroupMap.get(taxDescription) + taxAmount);
    } else {
      taxGroupMap.set(taxDescription, taxAmount);
    }
  }

  // Convert taxGroupMap to array of { description, amount } in insertion order
  info.taxGroups = [];
  for (const [description, amount] of taxGroupMap) {
    info.taxGroups.push({ description, amount });
  }

  // total (order.php lines 336-340)
  if (displayPriceWithTax) {
    info.total = info.subtotal + phpToNumber(info.shippingCost);
  } else {
    info.total = info.subtotal + info.tax + phpToNumber(info.shippingCost);
  }

  return {
    contentType: 'physical',
    delivery: { countryId: deliveryCountryId, zoneId: deliveryZoneId },
    products: orderProducts,
    info,
  };
}

module.exports = { buildOrder };
