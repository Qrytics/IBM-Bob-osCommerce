# Business rules of the osCommerce pricing slice

<!-- TEMPLATE — filled in by Bob (T1). Replace every TODO(bob) marker. Keep all headings, ids,
     "Legacy" and "Golden evidence" lines. Check with: npm run check:docs -- --stage analysis -->

Every rule the modern API reproduces. Legacy paths are relative to `legacy-baseline/catalog/includes/`, modern paths to `api/src/domain/`, evidence paths to `fixtures/golden/`. Unit tests cite these ids in their names.

## BR-01 — Rounding works on the string form of the number

- **Legacy:** `functions/general.php:305 tep_round()`
- **Modern:** `general.js tepRound`
- **Golden evidence:** `functions/tep_round.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-02 — Which tax rates apply to a location

- **Legacy:** `functions/general.php:328 tep_get_tax_rate()`
- **Modern:** `tax.js getTaxRate`
- **Golden evidence:** `functions/tax_rate.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-03 — Same-priority rates are summed, priorities are compounded

- **Legacy:** `functions/general.php:343-350 tep_get_tax_rate()`
- **Modern:** `tax.js getTaxRate`
- **Golden evidence:** `scenarios/ca-qc-compound.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-04 — Tax descriptions are joined in priority order

- **Legacy:** `functions/general.php:362 tep_get_tax_description()`
- **Modern:** `tax.js getTaxDescription`
- **Golden evidence:** `functions/tax_description.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-05 — Tax is added to prices only when prices are shown with tax

- **Legacy:** `functions/general.php:385 tep_add_tax()`
- **Modern:** `tax.js addTax`
- **Golden evidence:** `functions/add_tax.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-06 — Tax amount is price x rate / 100, unrounded

- **Legacy:** `functions/general.php:394 tep_calculate_tax()`
- **Modern:** `tax.js calculateTax`
- **Golden evidence:** `functions/calculate_tax.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-07 — The unit price is rounded before it is multiplied by the quantity

- **Legacy:** `classes/currencies.php:50 calculate_price()`
- **Modern:** `currency.js calculatePrice`
- **Golden evidence:** `functions/calculate_price.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-08 — Currency formatting: convert, round, separators, symbols

- **Legacy:** `classes/currencies.php:35 format()`
- **Modern:** `currency.js format`
- **Golden evidence:** `functions/format.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-09 — An active special replaces the product price

- **Legacy:** `classes/shopping_cart.php:280-284 calculate()`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `scenarios/us-fl-specials.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-10 — Attribute prices are added or subtracted, each priced separately in the cart

- **Legacy:** `classes/shopping_cart.php:290-302 calculate()`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `scenarios/us-fl-negative-attribute.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-11 — The cart page taxes a guest at the store location

- **Legacy:** `classes/shopping_cart.php:276 + functions/general.php:331-339`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `scenarios/ca-qc-compound-inclusive.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-12 — Cart weight and item count

- **Legacy:** `classes/shopping_cart.php:287 calculate(), :203 count_contents()`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `functions/cart_calculate.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-13 — An order line is priced from price + attributes as one amount

- **Legacy:** `classes/order.php:290,312 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/us-fl-jpy-rounds-dollars.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-14 — Order tax uses the delivery address

- **Legacy:** `classes/order.php:210,287 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/ca-on-hst-inclusive.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-15 — Prices without tax: tax is added on top of the subtotal

- **Legacy:** `classes/order.php:325,339 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/us-fl-basic-flat.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-16 — Prices with tax: tax is backed out of the shown price

- **Legacy:** `classes/order.php:318,337 cart()`
- **Modern:** `order.js buildOrder + tax.js inclusiveTaxPortion`
- **Golden evidence:** `scenarios/us-fl-inclusive-flat.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-17 — Tax is grouped by tax description

- **Legacy:** `classes/order.php:319-330 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/de-mixed-classes-eur.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-18 — Shipping weight: box tare or padding, split into boxes

- **Legacy:** `classes/shipping.php:50-62 quote()`
- **Modern:** `shipping/index.js prepareShipment`
- **Golden evidence:** `scenarios/us-fl-table-weight-multibox.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-19 — Flat-rate shipping

- **Legacy:** `modules/shipping/flat.php:48 quote()`
- **Modern:** `shipping/flat.js quote`
- **Golden evidence:** `scenarios/us-fl-basic-flat.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-20 — Per-item shipping

- **Legacy:** `modules/shipping/item.php:48 quote()`
- **Modern:** `shipping/item.js quote`
- **Golden evidence:** `scenarios/us-fl-item-shipping.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-21 — Table-rate shipping by weight or by price

- **Legacy:** `modules/shipping/table.php:48 quote(), :111 getShippableTotal()`
- **Modern:** `shipping/table.js quote`
- **Golden evidence:** `scenarios/us-fl-table-price.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-22 — Shipping modules report a tax rate when they have a tax class

- **Legacy:** `modules/shipping/flat.php:57 (same in item.php, table.php)`
- **Modern:** `shipping/*.js quote`
- **Golden evidence:** `scenarios/us-fl-taxed-shipping.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-23 — Free shipping is offered at the shipping step

- **Legacy:** `../checkout_shipping.php:73-100, 115-129`
- **Modern:** `shipping/index.js isFreeShippingOffered + selectShipping`
- **Golden evidence:** `scenarios/us-fl-free-shipping-over.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-24 — The order-total step re-checks free shipping

- **Legacy:** `modules/order_total/ot_shipping.php:29-45 process()`
- **Modern:** `orderTotals/shipping.js process`
- **Golden evidence:** `scenarios/ca-free-shipping-international.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-25 — Shipping tax is added to tax, tax group and total

- **Legacy:** `modules/order_total/ot_shipping.php:49-60 process()`
- **Modern:** `orderTotals/shipping.js process`
- **Golden evidence:** `scenarios/us-fl-taxed-shipping-inclusive.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-26 — Sub-total and total lines

- **Legacy:** `modules/order_total/ot_subtotal.php:26, ot_total.php:26`
- **Modern:** `orderTotals/subtotal.js + total.js`
- **Golden evidence:** `scenarios/us-fl-thousands-separator.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-27 — One tax line per non-zero tax group

- **Legacy:** `modules/order_total/ot_tax.php:26 process()`
- **Modern:** `orderTotals/tax.js process`
- **Golden evidence:** `scenarios/us-fl-untaxed-product.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.

## BR-28 — Order-total modules run in order; empty lines are dropped

- **Legacy:** `classes/order_total.php:34 process()`
- **Modern:** `orderTotals/index.js processAll`
- **Golden evidence:** `scenarios/us-fl-empty-cart.json`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.
