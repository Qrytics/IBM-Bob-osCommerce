# legacy-harness/: running the real osCommerce v2.3.4 pricing code

The "before" code is not re-implemented anywhere. This harness boots the **unmodified** files in
`legacy-baseline/` under PHP 7.4 and records what they compute.

| Path | Role |
|---|---|
| `lib/bootstrap.php` | Stands in for `application_top.php`: configuration constants, language strings, session stubs, then `require`s the legacy classes and functions. An undefined constant throws (PHP 7 would otherwise turn it silently into a string). |
| `lib/FakeDb.php` | `tep_db_query()` / `tep_db_fetch_array()` / `tep_db_num_rows()` answered from `fixtures/catalog.json` with MySQL semantics (string columns, `SUM` of `decimal(7,4)`, `GROUP BY` order, `LEFT JOIN` NULLs). Unknown SQL throws. |
| `bin/run-scenario.php` | One checkout, request by request as the storefront runs it: `shopping_cart.php` → `checkout_shipping.php` → `checkout_confirmation.php`. The two page-level blocks it has to transcribe (free-shipping pre-check, shipping selection) are marked with their source lines. |
| `bin/run-functions.php` | Batches of direct calls: `tep_round`, `tep_get_tax_rate`, `calculate_price`, `format`, `shoppingCart::calculate`, … |
| `scenarios/*.json` | Hand-written checkout scenarios, each showing one rule or quirk. |
| `tests/` | PHPUnit 9: `GoldenFunctionsTest.php` (locked) and `bob/` (characterization tests written by IBM Bob, task T2). |

## PHP 7.4 without installing PHP

`npm install` brings a WebAssembly build of PHP 7.4 (`@php-wasm/cli`). The scripts use it automatically
unless `PHP_BIN` points to a native PHP 7.4 (CI uses `shivammathur/setup-php`). The WebAssembly build only
sees files below the current directory, so always run the scripts from the repo root.

```bash
npm run golden:generate   # maintainers: re-record fixtures/golden (deterministic)
npm run golden:verify     # re-record into a temp dir and require a byte-for-byte match
npm run legacy:test       # PHPUnit, both DISPLAY_PRICE_WITH_TAX modes
npm run holdout           # new random seed → fresh legacy cases → equivalence check of the Node code
```

Why PHP 7.4: osCommerce 2.3.4 uses `each()` (removed in PHP 8) and relies on PHP 7 comparison and
string-conversion rules, which PHP 8 changed.
