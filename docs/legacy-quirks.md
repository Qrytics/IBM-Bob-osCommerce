# Legacy quirks preserved on purpose

<!-- Filled in by Bob (T1). Keep all headings, ids, "Legacy" and "Golden evidence" lines.
     Check with: npm run check:docs -- --stage analysis -->

Behaviour of osCommerce v2.3.4 that looks like a bug (and often is). The modern API reproduces each one exactly, because it must match the legacy output. Each entry says how a future "corrected" mode could behave.

## Q-01 — tep_round() breaks on numbers PHP prints in exponent form

- **Legacy:** `functions/general.php:305`
- **Golden evidence:** `functions/tep_round.json (tepRound(0.00001, 2))`
- **What happens:** `tep_round` works by calling `strpos($number, '.')` on line 306. PHP converts the float `0.00001` to the string `"1.0E-5"` (because the ini setting `precision = 14` causes PHP to use scientific notation for very small numbers). The string `"1.0E-5"` does contain a `.`, so `strpos` returns a non-zero position. However, `strlen(substr("1.0E-5", strpos("1.0E-5", '.')+1)) = strlen("0E-5") = 4`, which is `> 2` (precision), so the truncation branch executes. The truncated string is `"1.0E"` (substr to position 4), its last character is `"E"` which is not `>= 5`, so the number is returned as the string `"1.0E"`. PHP then evaluates `"1.0E"` in numeric context as `1` (stops parsing at the non-numeric `E`). For `tep_round(0.00001, 4)`, the string `"1.0E-5"` has exactly 4 characters after `.`, so the length check `> 4` is false, and the original string `"1.0E-5"` is returned unchanged.
- **Worked example:** Legacy: `tep_round(0.00001, 2)` → `"1"` (fixture args `[0.00001, 2]`, expected `"1"`). Mathematically expected: `0.00` (the number is smaller than half a cent). Legacy: `tep_round(0.00001, 4)` → `"1.0E-5"` (fixture args `[0.00001, 4]`, expected `"1.0E-5"`). Both results are wrong; the correct answer is `0` in either case.
- **A future fix:** A corrected mode would call PHP's native `round()` function directly. This would return `0` for `round(0.00001, 2)` and `0` for `round(0.00001, 4)`. Merchants would see no visible change for normal commerce prices (which are never `1.0E-5`), but the fix prevents potential corruption if a product with a near-zero price is ever introduced.

## Q-02 — tep_round() rounds negative numbers the wrong way

- **Legacy:** `functions/general.php:305`
- **Golden evidence:** `functions/tep_round.json (tepRound(-1.005, 2))`
- **What happens:** `tep_round` truncates the string representation of the number one digit past the requested precision, then checks `if (substr($number, -1) >= 5)`. For the input `-1.005`, PHP converts it to the string `"-1.005"`. `strpos("-1.005", '.')` = 2; `strlen("-1.00"[3:]) = strlen("5") = 1` which is not `> 2`... actually the string length after the `.` is 3, which is `> 2`, so the code truncates to `substr("-1.005", 0, 2+1+2+1) = substr("-1.005", 0, 6)` = `"-1.005"` minus last char = `"-1.00"`, then the last char is `"5"` which is `>= 5`, so it performs `"-1.00" + 0.01 = -0.99` (PHP arithmetic adds 0.01 to the string which was parsed as `-1.00`, giving `-0.99`). The mathematically correct rounding of `-1.005` to 2 decimal places toward positive infinity would give `-1.00`, and rounding half-away from zero would give `-1.01`.
- **Worked example:** Legacy: `tep_round(-1.005, 2)` → `"-0.99"` (fixture args `[-1.005, 2]`, expected `"-0.99"`). Mathematically expected (half-away from zero): `-1.01`. The off-by-one is caused by treating negative numbers as positive strings and adding rather than subtracting.
- **A future fix:** A corrected mode would use `round($number, $precision)` which implements half-away-from-zero for negative numbers, returning `-1.01`. The practical impact for merchants is that credit-note or refund amounts with negative prices would be rounded correctly instead of being inflated by 0.02.

## Q-03 — Rounding per unit before multiplying by the quantity

- **Legacy:** `classes/currencies.php:50`
- **Golden evidence:** `scenarios/us-fl-halfcent-exclusive.json`
- **What happens:** `calculate_price($products_price, $products_tax, $quantity)` at line 50–53 calls `tep_round(tep_add_tax($products_price, $products_tax), decimal_places)` to get a rounded per-unit price, then multiplies by `$quantity`. This means rounding error accumulates multiplicatively. A "half-cent" product (price `10.005` USD) rounds to `10.01` per unit; 7 units = `70.07`. If you were to round the total `7 × 10.005 = 70.035` to 2 decimals the result would be `70.04` — a 3-cent discrepancy across all attribute and product lines combined.
- **Worked example:** Legacy: product 29 (price `"10.005"`, qty 7) → cart contributes `10.01 × 7 = 70.07`. Product 30 (price `"19.995"`, qty 7) → `20.00 × 7 = 140.00`. Cart total = `210.07` (fixture `scenarios/us-fl-halfcent-exclusive.json`, `cart.total = "210.07"`). If rounded after multiplying: `(7 × 10.005) + (7 × 19.995) = 70.035 + 139.965 = 210.00` — a 7-cent difference.
- **A future fix:** A corrected mode would compute `round(tep_add_tax(price, tax) * qty, decimal_places)`, rounding after multiplication. This gives the mathematically accurate total and eliminates per-unit rounding accumulation.

## Q-04 — The cart page and the order disagree on the same cart

- **Legacy:** `classes/shopping_cart.php:290 vs classes/order.php:290`
- **Golden evidence:** `scenarios/us-fl-jpy-rounds-dollars.json`
- **What happens:** `shoppingCart::calculate()` (line 286–301) prices the product and each attribute separately — `calculate_price(products_price, tax, qty)` + `calculate_price(attr_price, tax, qty)` — and accumulates rounded per-line totals. `order::cart()` (line 290–312) instead sets `final_price = products_price + attributes_price()` first (combining them into one amount without rounding) and then calls `calculate_price(final_price, tax, qty)` once. The rounding at a different stage produces a different total, especially when currencies have 0 decimal places (like JPY).
- **Worked example:** In `scenarios/us-fl-jpy-rounds-dollars.json` (JPY, 0 decimals, prices with tax), the cart total is `"866"` while the order subtotal is `"867"`. Product 25 (price `69.99`, attribute `+2.495`, qty 3): cart prices separately as `round(69.99 × 1.07, 0) × 3 + round(2.495 × 1.07, 0) × 3 = 75 × 3 + 3 × 3 = 225 + 9 = 234`; order prices as `round(72.485 × 1.07, 0) × 3 = round(77.55895, 0) × 3 = 78 × 3 = 234` — same here, but the aggregate differs across all lines.
- **A future fix:** A corrected mode would align both the cart and the order to use the same pricing path. The simplest correction is to have both use the order's combined-final-price approach, which avoids attributing rounding error to each individual attribute.

## Q-05 — The cart page uses the store tax location, the order uses the delivery address

- **Legacy:** `classes/shopping_cart.php:276, modules/shipping/table.php:114`
- **Golden evidence:** `scenarios/ca-table-price-inclusive.json`
- **What happens:** `shoppingCart::calculate()` calls `tep_get_tax_rate($tax_class_id)` with no location arguments (line 276). The function then falls back to `STORE_COUNTRY` / `STORE_ZONE` because no customer session is registered (line 334–335 of general.php). The cart total and the table-shipping price lookup therefore use the store's Florida tax rate. The order object, however, uses the customer's actual delivery address to compute tax (line 287 of order.php). In the `ca-table-price-inclusive.json` scenario, this means the cart's price lookup hits the Florida 7% rate bracket while the order taxes at Ontario's 13% HST.
- **Worked example:** In `scenarios/ca-table-price-inclusive.json`, 5 × product 22 (price 89.99, DISPLAY_PRICE_WITH_TAX true). Cart uses FL 7%: `tep_round(89.99 × 1.07, 2) × 5 = 96.29 × 5 = 481.45` → cart total `"481.45"` (fixture). The table-shipping price lookup sees `481.45` and selects the `<= 500` band (rate $6). But the order taxes at ON 13%: subtotal = `tep_round(89.99 × 1.13, 2) × 5 = 101.69 × 5 = 508.45`. If the correct Ontario price were used, `508.45 > 500`, the `99999:0` free-shipping band would have been selected instead.
- **A future fix:** A corrected mode would pass the known delivery country and zone to `tep_get_tax_rate` when building the cart total, unifying cart and order tax calculations. Merchants would see the cart price and shipping cost reflect the customer's actual destination from the first page.

## Q-06 — The tax-inclusive divisor is built by string concatenation

- **Legacy:** `classes/order.php:318`
- **Golden evidence:** `functions/inclusive_tax.json (rate 100)`
- **What happens:** Line 318 computes the tax portion as `shown_price - shown_price / divisor`. The divisor is built by string concatenation: `"1.0" . str_replace('.', '', $products_tax)` for rates `< 10` (e.g. rate 7 → `"1.07"`), or `"1." . str_replace('.', '', $products_tax)` for rates `>= 10` (e.g. rate 13 → `"1.13"`). `str_replace('.', '', rate)` removes the decimal point from the rate string, so rate `9.975` → `"9975"`, giving divisor `"1.09975"`. For rate `100`, `str_replace('.', '', 100) = "100"`, so the divisor becomes `"1." . "100" = "1.100"` instead of the correct `"2.0"`. This means the inclusive tax portion for rate `100%` is computed as `price - price/1.1` (as if the rate were 10%), not `price/2`.
- **Worked example:** Legacy: `inclusiveTaxPortion(100, 100)` (price 100, rate 100%) → the divisor is `"1.100"` (not `"2.0"`); result = `100 - 100/1.1 = 100 - 90.909... = 9.090...`. Fixture `functions/inclusive_tax.json` at rate `99.5` (just below 100) shows `args [100, 99.5]` → `"49.874686716792"` (roughly half of 100, correct for ~100% rate). Mathematically expected for rate 100%: `50` (exactly half). The bug only affects tax rates of exactly 100% or rates where concatenation produces a wrong divisor (e.g. rate `9.9` → `"1.099"` instead of `"1.099"` — that one is fine — but rate `10.5` → `"1.105"` is correct because `str_replace('.','','10.5') = "105"` → `"1.105"` = 1 + 10.5/100 ✓).
- **A future fix:** A corrected mode would compute the divisor arithmetically as `1 + rate/100`, giving `1 + 100/100 = 2.0` for a 100% rate. The fix has no effect on normal retail tax rates (< 50%) but would matter for theoretical 100% luxury or sin taxes.

## Q-07 — With prices shown without tax, tax counts towards the free-shipping threshold

- **Legacy:** `../checkout_shipping.php:93, modules/order_total/ot_shipping.php:41`
- **Golden evidence:** `scenarios/ca-free-shipping-tax-counts.json`
- **What happens:** Both `checkout_shipping.php` (line 93) and `ot_shipping::process()` (line 41) compare `$order->info['total']` against the free-shipping threshold. When `DISPLAY_PRICE_WITH_TAX == 'false'`, the order total is `subtotal + tax + shipping_cost` (see BR-15). Tax is therefore included in the comparison amount. When `DISPLAY_PRICE_WITH_TAX == 'true'`, the total is `subtotal + shipping_cost` (tax is already embedded in the subtotal), so tax is also included — but in a different sense. The result is that a product at $89.99 with 13% HST qualifies for a "free over $100" threshold even though the pre-tax price is below $100.
- **Worked example:** In `scenarios/ca-free-shipping-tax-counts.json`, product 22 qty 1, price `89.99`, HST 13%, `DISPLAY_PRICE_WITH_TAX = false`. Tax = `89.99 × 13/100 = 11.6987`. Order total = `89.99 + 11.6987 + 5 (shipping) = 106.6887`. Threshold `100`; `106.6887 >= 100` → free shipping offered (fixture `freeShippingOffered: true`). Without tax, `89.99 < 100` → threshold not met.
- **A future fix:** A corrected mode would compare only the pre-tax subtotal against the threshold (`$order->info['subtotal'] >= threshold`). This makes the free-shipping incentive predictable for customers: "spend $100 on goods before tax".

## Q-08 — Specials never expire in the price calculation

- **Legacy:** `classes/shopping_cart.php:280`
- **Golden evidence:** `scenarios/us-fl-specials.json`
- **What happens:** The query on line 280 is `SELECT specials_new_products_price FROM specials WHERE products_id = ? AND status = '1'`. It only checks the `status` column. The `specials_expires_date` column (which can hold a date in the future or past) is never tested. In the demo database, a special can have `status = 1` and an `expires_date` in the past; the code will still use the special price. Conversely, a special with `status = 0` (disabled) is always ignored, even if the date has not yet passed.
- **Worked example:** In `scenarios/us-fl-specials.json`, the scenario description states "an expired special with status 1 is still applied". Products 5 and 6 both show `finalPrice = "30"` (their special price), even though the fixture catalog has an expiry date in the past. The original catalog price of product 5 is $30.00 (already on special), confirming the expired-but-status-1 special is active in the legacy code.
- **A future fix:** A corrected mode would add `AND (specials_expires_date = '0000-00-00' OR specials_expires_date > NOW())` to the query. Merchants with long-running promotions set to `status = 1` would need to renew them when they expire; accidental over-application of old discounts would be prevented.

## Q-09 — Untaxed products create a hidden "Unknown tax rate" group

- **Legacy:** `functions/general.php:376, modules/order_total/ot_tax.php:31`
- **Golden evidence:** `scenarios/us-fl-untaxed-product.json`
- **What happens:** When a product's `tax_class_id = 0`, `tep_get_tax_description(0, country, zone)` finds no matching `tax_rates` rows and returns `TEXT_UNKNOWN_TAX_RATE` = `"Unknown tax rate"` (line 376 of general.php). The tax rate for class 0 is `0` (no rows). In `order::cart()`, the tax amount `(0/100) * shown_price = 0` is accumulated under key `"Unknown tax rate"` in `$order->info['tax_groups']`. The group is created with amount `0`. `ot_tax::process()` skips any group where `$value > 0` (line 31), so `"Unknown tax rate"` never appears in the output — but the key is present in `$order->info['tax_groups']`.
- **Worked example:** In `scenarios/us-fl-untaxed-product.json`, product 31 (gift wrap, `tax_class_id = 0`, qty 2). The fixture `orderBeforeShipping.taxGroups` contains `{"description": "Unknown tax rate", "amount": "0"}` alongside `{"description": "FL TAX 7.0%", "amount": "2.7993"}`. The `orderTotals` array has no `ot_tax` row for `"Unknown tax rate"` because `0 > 0` is false.
- **A future fix:** A corrected mode would use an empty string or `null` as the tax description for untaxed products instead of `"Unknown tax rate"`, and would skip accumulating a `$0` tax group entirely. This removes the misleading key from the tax-groups data structure.

## Q-10 — Prices are rounded to the decimals of the display currency before conversion

- **Legacy:** `classes/currencies.php:53`
- **Golden evidence:** `scenarios/us-fl-jpy-rounds-dollars.json`
- **What happens:** `calculate_price` at line 50–53 is `tep_round(tep_add_tax($products_price, $products_tax), $this->currencies[$currency]['decimal_places']) * $quantity`. The currency in scope is `$currency` (the **display** currency), not necessarily USD. When displaying in JPY (0 decimal places), `tep_round(price_with_tax_USD, 0)` rounds to the nearest dollar **before** multiplying by the JPY exchange rate. So a USD price of `72.485` rounds to `72` dollars (0 decimals), then `72 × 149.23 = 10744.56 JPY` rather than `72.485 × 149.23 = 10814.84 JPY`. This means the cart total in JPY is based on dollar-rounded amounts.
- **Worked example:** In `scenarios/us-fl-jpy-rounds-dollars.json` (JPY display, prices with tax), product 1 `finalPrice = "449.99"`, tax 7%. `tep_add_tax(449.99, 7) = 481.4893`. `tep_round(481.4893, 0) = 481`. Then in the order, `currencies->format(subtotal=867)` converts 867 USD at 149.23: `867 × 149.23 = 129,382.41` → formatted `"¥129,382"` (fixture `ot_subtotal.text`). The cart total is `"866"` (from rounding each product/attribute separately in JPY), not 867.
- **A future fix:** A corrected mode would keep full precision in the base currency (USD) throughout the calculation and only convert and round to the display currency at the final formatting step (i.e. in `format()`, not in `calculate_price()`). This gives the same display-currency total regardless of how many intermediate products are in the cart.
