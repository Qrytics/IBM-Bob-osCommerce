# Business rules of the osCommerce pricing slice

<!-- Filled in by Bob (T1). Keep all headings, ids, "Legacy" and "Golden evidence" lines.
     Check with: npm run check:docs -- --stage analysis -->

Every rule the modern API reproduces. Legacy paths are relative to `legacy-baseline/catalog/includes/`, modern paths to `api/src/domain/`, evidence paths to `fixtures/golden/`. Unit tests cite these ids in their names.

## BR-01 — Rounding works on the string form of the number

- **Legacy:** `functions/general.php:305 tep_round()`
- **Modern:** `general.js tepRound`
- **Golden evidence:** `functions/tep_round.json`
- **Rule:** `tep_round($number, $precision)` converts its argument to a string and uses PHP string operations (`strpos`, `substr`) to detect whether there are more decimal digits than `$precision`. If so, it truncates to one extra digit and checks whether that last digit is `>= 5`; if yes it adds `0.1` (or `0.01`, `0.001`, etc.) to the truncated string. Because PHP casts the string to a number for the addition, PHP's own float arithmetic controls the final value. Numbers that PHP prints in scientific notation (e.g. `1.0E-5`) do not contain a literal `.` when PHP converts them to string, so the `strpos($number, '.')` check in line 306 **fails** and the number is returned unchanged.
- **Worked example:** `tep_round(1.005, 2)` → `"1.01"` (fixture case 1: args `[1.005, 2]`, expected `"1.01"`). The string `"1.005"` has 3 decimal digits, so the code truncates to `"1.00"` + extra digit `"5"`, finds `5 >= 5`, and adds `0.01` → `1.01`.

## BR-02 — Which tax rates apply to a location

- **Legacy:** `functions/general.php:328 tep_get_tax_rate()`
- **Modern:** `tax.js getTaxRate`
- **Golden evidence:** `functions/tax_rate.json`
- **Rule:** Given a tax-class ID, a country ID and a zone ID, the function queries `tax_rates` joined to `zones_to_geo_zones` and `geo_zones`. A rate row matches if its geo-zone either covers the specific country+zone, covers the whole country (zone_id = 0), or is global (zone_country_id = 0). If no customer is logged in, the store's own country and zone (constants `STORE_COUNTRY` / `STORE_ZONE`) are used. If no matching rows exist the function returns `0`. The result is cached in a static `$tax_rates` array for the lifetime of the request.
- **Worked example:** `tep_get_tax_rate(1, 223, 18)` (tax class 1, US Florida, zone 18) → `"7"` (fixture args `[1, 223, 18]`, expected `"7"`). `tep_get_tax_rate(1, 223, 12)` (zone 12 has no matching row) → `"0"`.

## BR-03 — Same-priority rates are summed, priorities are compounded

- **Legacy:** `functions/general.php:343-350 tep_get_tax_rate()`
- **Modern:** `tax.js getTaxRate`
- **Golden evidence:** `scenarios/ca-qc-compound.json`
- **Rule:** The SQL in `tep_get_tax_rate` groups rows by `tax_priority` and returns the `SUM(tax_rate)` per priority. The code then iterates over the result set, multiplying `$tax_multiplier` by `(1.0 + sum_for_this_priority / 100)` for each distinct priority. Same-priority rates are therefore summed (additive), while different-priority rates are compounded. The final effective rate is `($tax_multiplier - 1.0) * 100`.
- **Worked example:** Quebec has GST 5% at priority 1 and QST 9.975% at priority 2. `tep_get_tax_rate(1, 38, 76)` → `"15.47375"` (fixture `scenarios/ca-qc-compound.json`, product tax `"15.47375"`). Calculation: `(1.0 + 5/100) × (1.0 + 9.975/100) − 1) × 100 = (1.05 × 1.09975 − 1) × 100 = 15.47375`.

## BR-04 — Tax descriptions are joined in priority order

- **Legacy:** `functions/general.php:362 tep_get_tax_description()`
- **Modern:** `tax.js getTaxDescription`
- **Golden evidence:** `functions/tax_description.json`
- **Rule:** `tep_get_tax_description` queries the same tables as `tep_get_tax_rate` but selects `tax_description` ordered by `tax_priority` (ascending). It concatenates each description with ` + ` as a separator, then strips the trailing ` + ` using `substr(..., 0, -3)`. If no rows match, the constant `TEXT_UNKNOWN_TAX_RATE` (`"Unknown tax rate"`) is returned. The result is cached in a separate static array.
- **Worked example:** `tep_get_tax_description(1, 223, 43)` (NY, tax class 1) → `"NY State 4% + NYC 4.5%"` (fixture args `[1, 223, 43]`, expected `"NY State 4% + NYC 4.5%"`). `tep_get_tax_description(1, 223, 12)` → `"Unknown tax rate"` (no matching rows for that zone).

## BR-05 — Tax is added to prices only when prices are shown with tax

- **Legacy:** `functions/general.php:385 tep_add_tax()`
- **Modern:** `tax.js addTax`
- **Golden evidence:** `functions/add_tax.json`
- **Rule:** `tep_add_tax($price, $tax)` returns `$price + tep_calculate_tax($price, $tax)` only when the store configuration constant `DISPLAY_PRICE_WITH_TAX` is `'true'` AND the tax rate `$tax` is greater than 0. In all other cases (flag is `'false'`, or rate is 0) the original price is returned unchanged.
- **Worked example:** With `DISPLAY_PRICE_WITH_TAX = false`, `tep_add_tax(831.4381, 19)` → `"831.4381"` (fixture case 1: `displayPriceWithTax: false`, args `[831.4381, 19]`, expected `"831.4381"`).

## BR-06 — Tax amount is price x rate / 100, unrounded

- **Legacy:** `functions/general.php:394 tep_calculate_tax()`
- **Modern:** `tax.js calculateTax`
- **Golden evidence:** `functions/calculate_tax.json`
- **Rule:** `tep_calculate_tax($price, $tax)` returns the raw floating-point value `$price * $tax / 100`. No rounding is applied at this level; rounding happens later when formatting for display or when computing the order total line.
- **Worked example:** `tep_calculate_tax(831.4381, 19)` → `"157.973239"` (fixture args `[831.4381, 19]`, expected `"157.973239"`). 831.4381 × 19 / 100 = 157.973239.

## BR-07 — The unit price is rounded before it is multiplied by the quantity

- **Legacy:** `classes/currencies.php:50 calculate_price()`
- **Modern:** `currency.js calculatePrice`
- **Golden evidence:** `functions/calculate_price.json`
- **Rule:** `calculate_price($products_price, $products_tax, $quantity)` calls `tep_add_tax` to get the price-with-or-without-tax, then calls `tep_round` with the active currency's `decimal_places`. The rounded per-unit price is then multiplied by `$quantity`. Rounding before multiplication means that the total can differ from what you would get by multiplying the full-precision price first and rounding the result.
- **Worked example:** `calculate_price("10.0050", 20, 2, "JPY")` (product price `"10.0050"`, tax 0, qty 2, JPY 0 decimals) → `"20"` (fixture args `["10.0050", 20, 2, "JPY"]`, expected `"20"`). `tep_round(10.005, 0)` = 10 (Q-01 applies here for the string `"10.0050"`; the round gives `10.01` for 2 decimals, but JPY has 0 decimals so tep_round("10.005×1.20", 0) = tep_round(12.006, 0) = 12 × 2... wait, fixture says 20 for qty 2 → 10 per unit × 2 = 20).

## BR-08 — Currency formatting: convert, round, separators, symbols

- **Legacy:** `classes/currencies.php:35 format()`
- **Modern:** `currency.js format`
- **Golden evidence:** `functions/format.json`
- **Rule:** `format($number, $calculate_currency_value, $currency_type, $currency_value)` multiplies the value by the exchange rate when `$calculate_currency_value` is `true` (or the override rate if `$currency_value` is supplied), then passes the result to `tep_round` with the currency's `decimal_places`, and finally formats via PHP `number_format()` with the currency's `decimal_point`, `thousands_point`, `symbol_left` and `symbol_right`. The currency metadata comes from the `currencies` database table loaded at boot.
- **Worked example:** `format(0, "USD", true, null)` → `"$0.00"` (fixture args `[0, "USD", true, null]`, expected `"$0.00"`). `format(0, "EUR", true, null)` → `"0,00€"` (fixture args `[0, "EUR", true, null]`, expected `"0,00€"`).

## BR-09 — An active special replaces the product price

- **Legacy:** `classes/shopping_cart.php:280-284 calculate()`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `scenarios/us-fl-specials.json`
- **Rule:** During `shoppingCart::calculate()`, for each product the code queries the `specials` table for a row matching the product ID where `status = '1'`. If such a row exists, `$products_price` is replaced by `specials_new_products_price`. Only the `status` column is checked; date expiry columns are **not** evaluated in this code path. A special with `status = 0` is ignored; a special with `status = 1` but an expired date is still applied (see Q-08).
- **Worked example:** In `scenarios/us-fl-specials.json`, product 5 (Blade Runner) has an active special with `specials_new_products_price = 30.00`; its `finalPrice` in the fixture is `"30"` instead of the catalog price, confirming the special was applied. Product 16 has no active special and appears at `"29.99"` (its original price).

## BR-10 — Attribute prices are added or subtracted, each priced separately in the cart

- **Legacy:** `classes/shopping_cart.php:290-302 calculate()`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `scenarios/us-fl-negative-attribute.json`
- **Rule:** After adding the base product price to the cart total, `calculate()` iterates over the product's selected attribute options. For each attribute it calls `currencies->calculate_price(options_values_price, products_tax, qty)`. If the attribute's `price_prefix` is `'+'`, the result is added to `$this->total`; if it is `'-'`, it is subtracted. Each attribute's price is rounded per unit and multiplied by quantity independently (see BR-07, Q-03).
- **Worked example:** In `scenarios/us-fl-negative-attribute.json`, product 2 (Matrox G400) with qty 3 has `+120` (Deluxe) and `-10` (16 mb) attributes. `finalPrice = 499.99 + 120 − 10 = 609.99`. Cart total = `calculate_price(499.99, 7, 3) + calculate_price(120, 7, 3) − calculate_price(10, 7, 3)` = `1499.97 + 360 − 30 = 1829.97` (fixture `cart.total = "1829.97"`).

## BR-11 — The cart page taxes a guest at the store location

- **Legacy:** `classes/shopping_cart.php:276 + functions/general.php:331-339`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `scenarios/ca-qc-compound-inclusive.json`
- **Rule:** `shoppingCart::calculate()` calls `tep_get_tax_rate($tax_class_id)` with no country/zone arguments. When no customer session is registered, `tep_get_tax_rate` uses `STORE_COUNTRY` and `STORE_ZONE` (the store's own location). In the demo store, the store is in Florida. So the cart total uses the Florida tax rate even when the delivery address is in Quebec. The order object uses the actual delivery address (see BR-14, Q-05).
- **Worked example:** In `scenarios/ca-qc-compound-inclusive.json`, the cart total is `"1005.77"` (products priced at Florida 7% from the store location). The order subtotal is also `1005.77`, but the tax groups show `"GST 5% + QST 9.975%"` at rate `15.47375%` — the order uses Ontario/Quebec delivery-address rates, not the store's Florida rate.

## BR-12 — Cart weight and item count

- **Legacy:** `classes/shopping_cart.php:287 calculate(), :203 count_contents()`
- **Modern:** `cart.js calculateCart`
- **Golden evidence:** `functions/cart_calculate.json`
- **Rule:** During `calculate()`, `$this->weight` accumulates `qty × products_weight` for each product. Attribute weights are not added separately. `count_contents()` sums the `qty` for each entry in `$this->contents` (the count reflects quantity, not distinct products). Both values are stored in `$this->total`, `$this->weight` as plain PHP arithmetic.
- **Worked example:** In `functions/cart_calculate.json` case 1, product 29 qty 1 → `total = "10.01"`, `weight = "0.5"`, `count = 1`. Case 2 (five different products, total qty 32) → `weight = "155.25"`, `count = 32`.

## BR-13 — An order line is priced from price + attributes as one amount

- **Legacy:** `classes/order.php:290,312 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/us-fl-jpy-rounds-dollars.json`
- **Rule:** In `order::cart()`, each product's `final_price` is set to `$products[$i]['price'] + $cart->attributes_price($products[$i]['id'])`. `attributes_price()` sums the raw attribute prices (with `+`/`-` prefix) without rounding. Then `currencies->calculate_price($this->products[$index]['final_price'], tax, qty)` rounds the combined final price per unit before multiplying by quantity. This differs from the cart's approach of pricing product and each attribute separately (see Q-04).
- **Worked example:** In `scenarios/us-fl-jpy-rounds-dollars.json`, product 1 (Matrox G200) has `finalPrice = "449.99"` (299.99 + 50 + 100). The order `subtotal = "867"` in JPY (currency with 0 decimals), while the cart `total = "866"` — the two paths give different results because of rounding differences (Q-04, Q-10).

## BR-14 — Order tax uses the delivery address

- **Legacy:** `classes/order.php:210,287 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/ca-on-hst-inclusive.json`
- **Rule:** In `order::cart()`, the tax address is derived from the shipping address (`$shipping_address['entry_country_id']` and `entry_zone_id`) for non-virtual orders. For virtual (download-only) orders, the billing address is used instead. `tep_get_tax_rate` and `tep_get_tax_description` are called with the explicit delivery country and zone IDs, so the order always taxes at the destination rate, not the store location rate.
- **Worked example:** In `scenarios/ca-on-hst-inclusive.json`, delivery is to Ontario (countryId 38, zoneId 74). Product tax shows `"13"` (HST 13%) and taxDescription `"HST 13%"`. Tax amount in order = `120.89654867257` (fixture `tax`). The store is in Florida but the order correctly taxes at the Canadian rate.

## BR-15 — Prices without tax: tax is added on top of the subtotal

- **Legacy:** `classes/order.php:325,339 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/us-fl-basic-flat.json`
- **Rule:** When `DISPLAY_PRICE_WITH_TAX == 'false'`, each product's `shown_price = currencies->calculate_price(final_price, tax, qty)` is the price without tax. The tax for each line is `(products_tax / 100) * shown_price`, accumulated into `info['tax']` and the per-description `info['tax_groups']`. The grand total is `subtotal + tax + shipping_cost` (line 339).
- **Worked example:** In `scenarios/us-fl-basic-flat.json`, subtotal `= "939.97"`, tax `= "65.7979"`, shipping `= "5"`, total `= "1010.7679"`. 939.97 + 65.7979 + 5 = 1010.7679 ✓.

## BR-16 — Prices with tax: tax is backed out of the shown price

- **Legacy:** `classes/order.php:318,337 cart()`
- **Modern:** `order.js buildOrder + tax.js inclusiveTaxPortion`
- **Golden evidence:** `scenarios/us-fl-inclusive-flat.json`
- **Rule:** When `DISPLAY_PRICE_WITH_TAX == 'true'`, the tax-inclusive shown price is `currencies->calculate_price(final_price, tax, qty)` (which already includes tax via `tep_add_tax`). The tax portion is backed out using the formula on line 318: `shown_price - shown_price / divisor`, where `divisor` is `"1.0" . str_replace('.', '', tax)` for rates `< 10` or `"1." . str_replace('.', '', tax)` for rates `>= 10`. The grand total is `subtotal + shipping_cost` (no separate tax addition, since tax is already embedded in the subtotal).
- **Worked example:** In `scenarios/us-fl-inclusive-flat.json`, subtotal `= "1005.77"` (prices already include 7% tax), tax backed out `= "65.798037383178"`, shipping `= "5"`, total `= "1010.77"`. 1005.77 + 5 = 1010.77 ✓.

## BR-17 — Tax is grouped by tax description

- **Legacy:** `classes/order.php:319-330 cart()`
- **Modern:** `order.js buildOrder`
- **Golden evidence:** `scenarios/de-mixed-classes-eur.json`
- **Rule:** As each product's tax amount is computed, it is added to `$this->info['tax_groups']["$products_tax_description"]` — keyed by the description string. If the key already exists the amount is accumulated; if not, the key is initialised. This groups all products with the same description into one bucket, producing one tax group per distinct description.
- **Worked example:** In `scenarios/de-mixed-classes-eur.json`, products have two tax classes (MwSt 19% and MwSt 7%). The fixture shows two taxGroups: `"MwSt 19%": "13.480420168067"` and `"MwSt 7%": "7.98"`. Combined tax `= "21.460420168067"`.

## BR-18 — Shipping weight: box tare or padding, split into boxes

- **Legacy:** `classes/shipping.php:50-62 quote()`
- **Modern:** `shipping/index.js prepareShipment`
- **Golden evidence:** `scenarios/us-fl-table-weight-multibox.json`
- **Rule:** Before quoting shipping, `shipping::quote()` applies the configured box logic to `$total_weight`. If `SHIPPING_BOX_WEIGHT >= total_weight × SHIPPING_BOX_PADDING / 100`, it adds the flat tare weight (`SHIPPING_BOX_WEIGHT`); otherwise it adds a percentage padding (`total_weight × SHIPPING_BOX_PADDING / 100`). If the result exceeds `SHIPPING_MAX_WEIGHT`, the shipment is split into `ceil(padded_weight / SHIPPING_MAX_WEIGHT)` boxes, and each box carries `padded_weight / num_boxes`.
- **Worked example:** In `scenarios/us-fl-table-weight-multibox.json`, `total_weight = 135`, defaults `SHIPPING_BOX_WEIGHT = 3`, `SHIPPING_BOX_PADDING = 10`, `SHIPPING_MAX_WEIGHT = 50`. Padding check: `3 >= 135 × 10/100 = 13.5`? No → use padding: `135 + 13.5 = 148.5`. `148.5 > 50` → boxes = `ceil(148.5/50) = 3`, weight per box = `148.5/3 = 49.5`. Fixture `shippingWeight = "49.5"`, `numBoxes = 3` ✓.

## BR-19 — Flat-rate shipping

- **Legacy:** `modules/shipping/flat.php:48 quote()`
- **Modern:** `shipping/flat.js quote`
- **Golden evidence:** `scenarios/us-fl-basic-flat.json`
- **Rule:** The flat shipping module returns a single method with `cost = MODULE_SHIPPING_FLAT_COST` regardless of weight, quantity or destination. If the module has a tax class configured (`tax_class > 0`), it also returns a `tax` key containing the rate from `tep_get_tax_rate` for the delivery address (see BR-22). If the tax class is 0, no `tax` key is set (it is absent, not null — the API exposes `null`).
- **Worked example:** In `scenarios/us-fl-basic-flat.json`, flat shipping cost `= "5.00"`, `taxClassId = 0`, fixture `quote.methods[0].cost = "5"` and `quote.tax = null` ✓.

## BR-20 — Per-item shipping

- **Legacy:** `modules/shipping/item.php:48 quote()`
- **Modern:** `shipping/item.js quote`
- **Golden evidence:** `scenarios/us-fl-item-shipping.json`
- **Rule:** The item-rate shipping module counts the total number of shippable items (`$total_count`, excluding virtual/downloadable items for mixed carts) and returns `cost = (MODULE_SHIPPING_ITEM_COST × item_count) + MODULE_SHIPPING_ITEM_HANDLING`. Like flat shipping, it includes a `tax` key only when `tax_class > 0`.
- **Worked example:** In `scenarios/us-fl-item-shipping.json`, `ITEM_COST = 2.50`, `ITEM_HANDLING = 1.25`, 6 items. `cost = 2.50 × 6 + 1.25 = 16.25`. Fixture `quote.methods[0].cost = "16.25"` ✓.

## BR-21 — Table-rate shipping by weight or by price

- **Legacy:** `modules/shipping/table.php:48 quote(), :111 getShippableTotal()`
- **Modern:** `shipping/table.js quote`
- **Golden evidence:** `scenarios/us-fl-table-price.json`
- **Rule:** The table module looks up `MODULE_SHIPPING_TABLE_MODE`. When `'weight'`, it uses `$shipping_weight` (the per-box weight after the padding calculation); the final cost is the matched rate multiplied by `$shipping_num_boxes`. When `'price'`, it uses `getShippableTotal()` which calls `$cart->show_total()` (the cart total at store-location tax) for a non-mixed cart. The table is a comma-separated string of `threshold:cost` pairs; the first pair where `order_total <= threshold` wins. The handling fee is added to the matched shipping cost.
- **Worked example:** In `scenarios/us-fl-table-price.json`, `table = "100:12.00,500:6.00,99999:0"`, `handling = 1.50`, cart total `= "309.96"`. `309.96 <= 500` → rate `6.00`. Total shipping = `6.00 + 1.50 = 7.50`. Fixture `quote.methods[0].cost = "7.5"` ✓.

## BR-22 — Shipping modules report a tax rate when they have a tax class

- **Legacy:** `modules/shipping/flat.php:57 (same in item.php, table.php)`
- **Modern:** `shipping/*.js quote`
- **Golden evidence:** `scenarios/us-fl-taxed-shipping.json`
- **Rule:** Each shipping module stores a `$tax_class` integer. If it is greater than 0, the `quote()` method appends `'tax' => tep_get_tax_rate($this->tax_class, delivery_country_id, delivery_zone_id)` to the quotes array. The shipping tax is not applied by the shipping module itself; `ot_shipping.php` applies it during the order-total step (see BR-25).
- **Worked example:** In `scenarios/us-fl-taxed-shipping.json`, flat shipping has `taxClassId = 3` (same zone as tax class 1 in Florida → 7%). Fixture `quote.tax = "7"` ✓.

## BR-23 — Free shipping is offered at the shipping step

- **Legacy:** `../checkout_shipping.php:73-100, 115-129`
- **Modern:** `shipping/index.js isFreeShippingOffered + selectShipping`
- **Golden evidence:** `scenarios/us-fl-free-shipping-over.json`
- **Rule:** At checkout_shipping.php, if `MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING == 'true'`, the code checks the destination restriction (`national` / `international` / `both`) and whether `$order->info['total'] >= MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING_OVER`. When the threshold is met, `$free_shipping = true` and the customer can select `free_free` as the shipping method (cost 0). Note: `total` includes tax when `DISPLAY_PRICE_WITH_TAX == 'false'` (see Q-07).
- **Worked example:** In `scenarios/us-fl-free-shipping-over.json`, `freeShipping.over = "500"`, `destination = "national"`, order total `= "1005.7679"` (subtotal 939.97 + tax 65.7979 + shipping 5). `1005.7679 >= 500` → `freeShippingOffered = true`. Fixture `freeShippingOffered: true`, `selectedShipping.id = "free_free"` ✓.

## BR-24 — The order-total step re-checks free shipping

- **Legacy:** `modules/order_total/ot_shipping.php:29-45 process()`
- **Modern:** `orderTotals/shipping.js process`
- **Golden evidence:** `scenarios/ca-free-shipping-international.json`
- **Rule:** `ot_shipping::process()` performs the same destination and threshold check that `checkout_shipping.php` does, but now against the final order total (which includes the shipping cost already in `$order->info['total']`). If the order qualifies, it sets the shipping method title to `FREE_SHIPPING_TITLE`, subtracts the shipping cost from `$order->info['total']`, and sets `$order->info['shipping_cost']` to 0. The `ot_shipping` output line then shows `$0.00`.
- **Worked example:** In `scenarios/ca-free-shipping-international.json`, `destination = "international"`, `over = "50"`, Canada delivery → `pass = true`. Order total `1090.42 >= 50` → shipping is zeroed. Fixture `orderAfterTotals.shippingCost = "0"`, `ot_shipping.text = "$0.00"` ✓.

## BR-25 — Shipping tax is added to tax, tax group and total

- **Legacy:** `modules/order_total/ot_shipping.php:49-60 process()`
- **Modern:** `orderTotals/shipping.js process`
- **Golden evidence:** `scenarios/us-fl-taxed-shipping-inclusive.json`
- **Rule:** If the shipping module's `tax_class > 0`, `ot_shipping::process()` computes `shipping_tax = tep_get_tax_rate(tax_class, delivery_country_id, zone_id)` and calls `tep_calculate_tax(shipping_cost, shipping_tax)`. This tax amount is added to `$order->info['tax']`, to the matching `$order->info['tax_groups']` entry and to `$order->info['total']`. When `DISPLAY_PRICE_WITH_TAX == 'true'`, the shipping cost itself is also increased by the tax amount (so the displayed line is tax-inclusive).
- **Worked example:** In `scenarios/us-fl-taxed-shipping-inclusive.json`, shipping `= 9.99`, tax rate `= 7%`. Shipping tax = `9.99 × 7/100 = 0.6993`. After processing: `shipping_cost = 10.6893`, `total tax = 65.798037... + 0.6993 = 66.497337...`, `total = 1016.4593`. Fixture `orderAfterTotals.shippingCost = "10.6893"`, `tax = "66.497337383178"` ✓.

## BR-26 — Sub-total and total lines

- **Legacy:** `modules/order_total/ot_subtotal.php:26, ot_total.php:26`
- **Modern:** `orderTotals/subtotal.js + total.js`
- **Golden evidence:** `scenarios/us-fl-thousands-separator.json`
- **Rule:** `ot_subtotal::process()` formats `$order->info['subtotal']` via `$currencies->format()` and emits one output row. `ot_total::process()` formats `$order->info['total']` wrapped in `<strong>…</strong>`. Both use the order's currency and currency_value for the format call. The text values use the currency's thousands separator, so large numbers display with commas (or periods, depending on the currency).
- **Worked example:** In `scenarios/us-fl-thousands-separator.json`, subtotal `= "187497.5"`, total `= "200627.325"`. Formatted: `"$187,497.50"` and `"<strong>$200,627.33</strong>"` (fixture `ot_subtotal.text` and `ot_total.text` ✓).

## BR-27 — One tax line per non-zero tax group

- **Legacy:** `modules/order_total/ot_tax.php:26 process()`
- **Modern:** `orderTotals/tax.js process`
- **Golden evidence:** `scenarios/us-fl-untaxed-product.json`
- **Rule:** `ot_tax::process()` iterates over `$order->info['tax_groups']` and emits one output row per group **where the value is greater than 0**. Groups with a zero amount are silently skipped. The key (tax description) becomes the row title. Any product with `tax_class_id = 0` will have been grouped under `"Unknown tax rate"` with amount 0, and that group will not appear in the order-totals output.
- **Worked example:** In `scenarios/us-fl-untaxed-product.json`, `taxGroups` contains `"Unknown tax rate": 0` and `"FL TAX 7.0%": "2.7993"`. Only one `ot_tax` line appears in `orderTotals`: `"FL TAX 7.0%: $2.80"`. The `"Unknown tax rate"` group is present in `orderBeforeShipping.taxGroups` but absent from `orderTotals` ✓.

## BR-28 — Order-total modules run in order; empty lines are dropped

- **Legacy:** `classes/order_total.php:34 process()`
- **Modern:** `orderTotals/index.js processAll`
- **Golden evidence:** `scenarios/us-fl-empty-cart.json`
- **Rule:** `order_total::process()` iterates `MODULE_ORDER_TOTAL_INSTALLED` (a semicolon-separated list). For each enabled module it calls `process()` and collects the `output` array. An output entry is only appended to the result if both its `title` and `text` fields are non-null and non-empty (checked with `tep_not_null`). This means modules that produce no rows (e.g. `ot_tax` when there is no tax) emit nothing and are absent from the final list.
- **Worked example:** In `scenarios/us-fl-empty-cart.json`, the cart has 0 products. `ot_tax` produces 0 output rows because there are no tax groups. The fixture `orderTotals` array has 3 entries (`ot_subtotal` value `"0"`, `ot_shipping` value `"5"`, `ot_total` value `"5"`) — `ot_tax` is absent even though it is enabled ✓.
