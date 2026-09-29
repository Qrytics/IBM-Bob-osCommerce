// Business rules (BR-xx) and legacy quirks (Q-xx) of the osCommerce pricing slice (LOCKED).
//
// Single source of truth for the ids, titles and evidence used by the doc templates,
// scripts/check-docs.mjs and the unit-test citation gate. Paths are relative to the
// repo root; legacy line numbers refer to legacy-baseline/catalog/includes/.

export const RULES = [
  ['BR-01', 'Rounding works on the string form of the number', 'functions/general.php:305 tep_round()', 'general.js tepRound', 'functions/tep_round.json'],
  ['BR-02', 'Which tax rates apply to a location', 'functions/general.php:328 tep_get_tax_rate()', 'tax.js getTaxRate', 'functions/tax_rate.json'],
  ['BR-03', 'Same-priority rates are summed, priorities are compounded', 'functions/general.php:343-350 tep_get_tax_rate()', 'tax.js getTaxRate', 'scenarios/ca-qc-compound.json'],
  ['BR-04', 'Tax descriptions are joined in priority order', 'functions/general.php:362 tep_get_tax_description()', 'tax.js getTaxDescription', 'functions/tax_description.json'],
  ['BR-05', 'Tax is added to prices only when prices are shown with tax', 'functions/general.php:385 tep_add_tax()', 'tax.js addTax', 'functions/add_tax.json'],
  ['BR-06', 'Tax amount is price x rate / 100, unrounded', 'functions/general.php:394 tep_calculate_tax()', 'tax.js calculateTax', 'functions/calculate_tax.json'],
  ['BR-07', 'The unit price is rounded before it is multiplied by the quantity', 'classes/currencies.php:50 calculate_price()', 'currency.js calculatePrice', 'functions/calculate_price.json'],
  ['BR-08', 'Currency formatting: convert, round, separators, symbols', 'classes/currencies.php:35 format()', 'currency.js format', 'functions/format.json'],
  ['BR-09', 'An active special replaces the product price', 'classes/shopping_cart.php:280-284 calculate()', 'cart.js calculateCart', 'scenarios/us-fl-specials.json'],
  ['BR-10', 'Attribute prices are added or subtracted, each priced separately in the cart', 'classes/shopping_cart.php:290-302 calculate()', 'cart.js calculateCart', 'scenarios/us-fl-negative-attribute.json'],
  ['BR-11', 'The cart page taxes a guest at the store location', 'classes/shopping_cart.php:276 + functions/general.php:331-339', 'cart.js calculateCart', 'scenarios/ca-qc-compound-inclusive.json'],
  ['BR-12', 'Cart weight and item count', 'classes/shopping_cart.php:287 calculate(), :203 count_contents()', 'cart.js calculateCart', 'functions/cart_calculate.json'],
  ['BR-13', 'An order line is priced from price + attributes as one amount', 'classes/order.php:290,312 cart()', 'order.js buildOrder', 'scenarios/us-fl-jpy-rounds-dollars.json'],
  ['BR-14', 'Order tax uses the delivery address', 'classes/order.php:210,287 cart()', 'order.js buildOrder', 'scenarios/ca-on-hst-inclusive.json'],
  ['BR-15', 'Prices without tax: tax is added on top of the subtotal', 'classes/order.php:325,339 cart()', 'order.js buildOrder', 'scenarios/us-fl-basic-flat.json'],
  ['BR-16', 'Prices with tax: tax is backed out of the shown price', 'classes/order.php:318,337 cart()', 'order.js buildOrder + tax.js inclusiveTaxPortion', 'scenarios/us-fl-inclusive-flat.json'],
  ['BR-17', 'Tax is grouped by tax description', 'classes/order.php:319-330 cart()', 'order.js buildOrder', 'scenarios/de-mixed-classes-eur.json'],
  ['BR-18', 'Shipping weight: box tare or padding, split into boxes', 'classes/shipping.php:50-62 quote()', 'shipping/index.js prepareShipment', 'scenarios/us-fl-table-weight-multibox.json'],
  ['BR-19', 'Flat-rate shipping', 'modules/shipping/flat.php:48 quote()', 'shipping/flat.js quote', 'scenarios/us-fl-basic-flat.json'],
  ['BR-20', 'Per-item shipping', 'modules/shipping/item.php:48 quote()', 'shipping/item.js quote', 'scenarios/us-fl-item-shipping.json'],
  ['BR-21', 'Table-rate shipping by weight or by price', 'modules/shipping/table.php:48 quote(), :111 getShippableTotal()', 'shipping/table.js quote', 'scenarios/us-fl-table-price.json'],
  ['BR-22', 'Shipping modules report a tax rate when they have a tax class', 'modules/shipping/flat.php:57 (same in item.php, table.php)', 'shipping/*.js quote', 'scenarios/us-fl-taxed-shipping.json'],
  ['BR-23', 'Free shipping is offered at the shipping step', '../checkout_shipping.php:73-100, 115-129', 'shipping/index.js isFreeShippingOffered + selectShipping', 'scenarios/us-fl-free-shipping-over.json'],
  ['BR-24', 'The order-total step re-checks free shipping', 'modules/order_total/ot_shipping.php:29-45 process()', 'orderTotals/shipping.js process', 'scenarios/ca-free-shipping-international.json'],
  ['BR-25', 'Shipping tax is added to tax, tax group and total', 'modules/order_total/ot_shipping.php:49-60 process()', 'orderTotals/shipping.js process', 'scenarios/us-fl-taxed-shipping-inclusive.json'],
  ['BR-26', 'Sub-total and total lines', 'modules/order_total/ot_subtotal.php:26, ot_total.php:26', 'orderTotals/subtotal.js + total.js', 'scenarios/us-fl-thousands-separator.json'],
  ['BR-27', 'One tax line per non-zero tax group', 'modules/order_total/ot_tax.php:26 process()', 'orderTotals/tax.js process', 'scenarios/us-fl-untaxed-product.json'],
  ['BR-28', 'Order-total modules run in order; empty lines are dropped', 'classes/order_total.php:34 process()', 'orderTotals/index.js processAll', 'scenarios/us-fl-empty-cart.json'],
].map(([id, title, legacy, modern, evidence]) => ({ id, title, legacy, modern, evidence }));

export const QUIRKS = [
  ['Q-01', 'tep_round() breaks on numbers PHP prints in exponent form', 'functions/general.php:305', 'functions/tep_round.json (tepRound(0.00001, 2))'],
  ['Q-02', 'tep_round() rounds negative numbers the wrong way', 'functions/general.php:305', 'functions/tep_round.json (tepRound(-1.005, 2))'],
  ['Q-03', 'Rounding per unit before multiplying by the quantity', 'classes/currencies.php:50', 'scenarios/us-fl-halfcent-exclusive.json'],
  ['Q-04', 'The cart page and the order disagree on the same cart', 'classes/shopping_cart.php:290 vs classes/order.php:290', 'scenarios/us-fl-jpy-rounds-dollars.json'],
  ['Q-05', 'The cart page uses the store tax location, the order uses the delivery address', 'classes/shopping_cart.php:276, modules/shipping/table.php:114', 'scenarios/ca-table-price-inclusive.json'],
  ['Q-06', 'The tax-inclusive divisor is built by string concatenation', 'classes/order.php:318', 'functions/inclusive_tax.json (rate 100)'],
  ['Q-07', 'With prices shown without tax, tax counts towards the free-shipping threshold', '../checkout_shipping.php:93, modules/order_total/ot_shipping.php:41', 'scenarios/ca-free-shipping-tax-counts.json'],
  ['Q-08', 'Specials never expire in the price calculation', 'classes/shopping_cart.php:280', 'scenarios/us-fl-specials.json'],
  ['Q-09', 'Untaxed products create a hidden "Unknown tax rate" group', 'functions/general.php:376, modules/order_total/ot_tax.php:31', 'scenarios/us-fl-untaxed-product.json'],
  ['Q-10', 'Prices are rounded to the decimals of the display currency before conversion', 'classes/currencies.php:53', 'scenarios/us-fl-jpy-rounds-dollars.json'],
].map(([id, title, legacy, evidence]) => ({ id, title, legacy, evidence }));
