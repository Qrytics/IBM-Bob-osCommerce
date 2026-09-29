# Legacy quirks preserved on purpose

<!-- TEMPLATE — filled in by Bob (T1). Replace every TODO(bob) marker. Keep all headings, ids,
     "Legacy" and "Golden evidence" lines. Check with: npm run check:docs -- --stage analysis -->

Behaviour of osCommerce v2.3.4 that looks like a bug (and often is). The modern API reproduces each one exactly, because it must match the legacy output. Each entry says how a future "corrected" mode could behave.

## Q-01 — tep_round() breaks on numbers PHP prints in exponent form

- **Legacy:** `functions/general.php:305`
- **Golden evidence:** `functions/tep_round.json (tepRound(0.00001, 2))`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-02 — tep_round() rounds negative numbers the wrong way

- **Legacy:** `functions/general.php:305`
- **Golden evidence:** `functions/tep_round.json (tepRound(-1.005, 2))`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-03 — Rounding per unit before multiplying by the quantity

- **Legacy:** `classes/currencies.php:50`
- **Golden evidence:** `scenarios/us-fl-halfcent-exclusive.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-04 — The cart page and the order disagree on the same cart

- **Legacy:** `classes/shopping_cart.php:290 vs classes/order.php:290`
- **Golden evidence:** `scenarios/us-fl-jpy-rounds-dollars.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-05 — The cart page uses the store tax location, the order uses the delivery address

- **Legacy:** `classes/shopping_cart.php:276, modules/shipping/table.php:114`
- **Golden evidence:** `scenarios/ca-table-price-inclusive.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-06 — The tax-inclusive divisor is built by string concatenation

- **Legacy:** `classes/order.php:318`
- **Golden evidence:** `functions/inclusive_tax.json (rate 100)`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-07 — With prices shown without tax, tax counts towards the free-shipping threshold

- **Legacy:** `../checkout_shipping.php:93, modules/order_total/ot_shipping.php:41`
- **Golden evidence:** `scenarios/ca-free-shipping-tax-counts.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-08 — Specials never expire in the price calculation

- **Legacy:** `classes/shopping_cart.php:280`
- **Golden evidence:** `scenarios/us-fl-specials.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-09 — Untaxed products create a hidden "Unknown tax rate" group

- **Legacy:** `functions/general.php:376, modules/order_total/ot_tax.php:31`
- **Golden evidence:** `scenarios/us-fl-untaxed-product.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.

## Q-10 — Prices are rounded to the decimals of the display currency before conversion

- **Legacy:** `classes/currencies.php:53`
- **Golden evidence:** `scenarios/us-fl-jpy-rounds-dollars.json`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.
