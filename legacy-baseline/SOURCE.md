# Legacy baseline: osCommerce Online Merchant v2.3.4

This directory holds the **unmodified** osCommerce v2.3.4 source. It is the "before" state of the modernization.

| | |
|---|---|
| Upstream | https://github.com/osCommerce/oscommerce2 |
| Tag | `v2.3.4` |
| Commit | `329d51a0c82f83940fde632183c3487b6eced4bb` (2014-06-06) |
| License | GNU GPL v2 (see `LICENSE`) |
| Imported | `catalog/` (storefront and `catalog/admin/`), upstream `README.md` → `README.upstream.md` |

## Read-only

Nothing in this directory may be edited. `npm run check:protected` hashes every file here and fails the build if anything changes.

## Files that matter for the modernization

| File | What it contains |
|---|---|
| `catalog/shopping_cart.php` | Cart page: HTML, SQL and pricing mixed together |
| `catalog/checkout_shipping.php` | Shipping selection plus a free-shipping pre-check |
| `catalog/checkout_process.php` | Order placement: totals, stock, inserts, emails |
| `catalog/includes/functions/general.php` | `tep_round`, `tep_get_tax_rate`, `tep_get_tax_description`, `tep_add_tax`, `tep_calculate_tax` |
| `catalog/includes/classes/currencies.php` | `calculate_price`, `format` |
| `catalog/includes/classes/shopping_cart.php` | `calculate`, `attributes_price`, `get_products` |
| `catalog/includes/classes/order.php` | `cart()`: subtotal, tax, tax groups, total |
| `catalog/includes/classes/shipping.php` | Box weight and padding, module quotes |
| `catalog/includes/modules/shipping/{flat,item,table}.php` | Shipping quote rules |
| `catalog/includes/modules/order_total/ot_{subtotal,shipping,tax,total}.php` | Order-total lines, free shipping, shipping tax |
