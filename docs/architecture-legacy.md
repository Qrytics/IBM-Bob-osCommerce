# Legacy architecture: osCommerce v2.3.4 checkout

<!-- TEMPLATE — filled in by Bob (T1). Replace every TODO(bob) marker. Keep all headings, ids,
     "Legacy" and "Golden evidence" lines. Check with: npm run check:docs -- --stage analysis -->

How the storefront computed cart and checkout totals before the modernization.

## Overview

TODO(bob): two or three paragraphs: what the pricing slice does, which pages and classes take part, and why it is hard to change.

## Request flow

TODO(bob): a Mermaid sequence or flow diagram from `shopping_cart.php` through `checkout_shipping.php` and `checkout_confirmation.php` to `checkout_process.php`, showing the classes (`shoppingCart`, `order`, `shipping`, `order_total`, `currencies`), the `general.php` functions and the database tables involved.

## Where HTML, SQL and business math are coupled

TODO(bob): a table with columns File | HTML output | SQL queries | Business math | Globals/session, with one row per file in the slice, then a short explanation with a code excerpt.

## Data the pricing slice reads

TODO(bob): the tables and configuration constants the math depends on (see `legacy-harness/lib/FakeDb.php` and `legacy-harness/lib/bootstrap.php` for the exact list).

## Risks of changing the legacy code

TODO(bob): what makes a rewrite risky (float/string conversions, globals, implicit ordering, …) and how the golden fixtures reduce that risk.
