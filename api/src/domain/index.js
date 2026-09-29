'use strict';

/**
 * Checkout pipeline (PROVIDED, LOCKED).
 *
 * The modern counterpart of legacy-harness/bin/run-scenario.php. It calls the
 * translated domain functions in the same order the storefront pages called
 * the legacy code:
 *
 *   shopping_cart.php          -> calculateCart()
 *   checkout_shipping.php      -> buildOrder() without shipping, prepareShipment(),
 *                                 isFreeShippingOffered(), <module>.quote(), selectShipping()
 *   checkout_confirmation.php  -> buildOrder() with shipping, processAll()
 *
 * The returned object has the same shape as the `expected` block of every
 * fixtures/golden/scenarios/*.json file.
 */

const C = require('./constants');
const { calculateCart } = require('./cart');
const { buildOrder } = require('./order');
const { prepareShipment, isFreeShippingOffered, selectShipping } = require('./shipping');
const { processAll } = require('./orderTotals');

const SHIPPING_MODULES = Object.freeze({
  flat: require('./shipping/flat'),
  item: require('./shipping/item'),
  table: require('./shipping/table'),
});

const snapshot = (value) => JSON.parse(JSON.stringify(value));

/**
 * Resolve request settings against the catalog and apply defaults.
 * @param {Object} settings  scenario/request `settings`
 * @param {import('./types').Catalog} catalog
 */
function resolveSettings(settings, catalog) {
  const code = settings.currency || 'USD';
  const currency = catalog.currencies.find((c) => c.code === code);
  if (!currency) throw new RangeError(`Unknown currency ${code}`);
  return {
    pricing: { displayPriceWithTax: Boolean(settings.displayPriceWithTax), currency },
    shippingBox: { ...C.DEFAULT_SHIPPING_BOX, ...(settings.shippingBox || {}) },
    freeShipping: { ...C.DEFAULT_FREE_SHIPPING, ...(settings.freeShipping || {}) },
  };
}

/**
 * Run a full checkout and return every intermediate value the legacy code produced.
 * @param {{settings:Object, delivery:import('./types').Location, shipping:import('./types').ShippingConfig, items:Array<import('./types').CartItem>}} input
 * @param {import('./types').Catalog} catalog
 */
function checkoutTotals(input, catalog) {
  const { pricing, shippingBox, freeShipping } = resolveSettings(input.settings || {}, catalog);
  const items = input.items || [];
  const delivery = input.delivery;
  const shippingConfig = input.shipping;
  const module = SHIPPING_MODULES[shippingConfig.module];
  if (!module) throw new RangeError(`Unknown shipping module ${shippingConfig.module}`);

  // shopping_cart.php
  const cart = calculateCart(items, catalog, pricing);

  // checkout_shipping.php
  const firstOrder = buildOrder(items, catalog, { pricing, delivery, shipping: null });
  const orderBeforeShipping = snapshot(firstOrder.info);
  const shipment = prepareShipment(cart.weight, shippingBox);
  const freeShippingOffered = isFreeShippingOffered(firstOrder, freeShipping, catalog.store.countryId);
  const quote = module.quote({
    order: firstOrder, cartTotal: cart.total, cartCount: cart.count, shipment, config: shippingConfig, catalog,
  });
  const selectedShipping = selectShipping(quote, freeShippingOffered);

  // checkout_confirmation.php
  const order = buildOrder(items, catalog, { pricing, delivery, shipping: selectedShipping });
  const orderBeforeTotals = snapshot(order.info);
  const orderTotals = processAll(order, {
    catalog,
    displayPriceWithTax: pricing.displayPriceWithTax,
    currency: pricing.currency,
    freeShipping,
    storeCountryId: catalog.store.countryId,
    selectedShipping,
    installedShippingTaxClasses: { [shippingConfig.module]: shippingConfig.taxClassId || 0 },
  });

  return {
    cart,
    shipment,
    freeShippingOffered,
    quote,
    selectedShipping,
    products: order.products,
    orderBeforeShipping,
    orderBeforeTotals,
    orderAfterTotals: order.info,
    orderTotals,
  };
}

module.exports = { checkoutTotals, resolveSettings, SHIPPING_MODULES };
