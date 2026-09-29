# Session 02: T2 Baseline tests for the legacy business math

- **Date:** 2026-09-29
- **Mode:** 🧪 CleanCart Legacy Tester (`cc-legacy-tests`)
- **Files edited:** `legacy-harness/tests/bob/LegacyPricingTest.php`
- **Accept command and result:** `npm run legacy:test` → PHPUnit OK in both modes: 17 tests / 1662 assertions (`DISPLAY_PRICE_WITH_TAX=false`), 17 tests / 1636 assertions (`=true`); the skips are mode-specific tests via `requireMode()`

## What Bob did

- Replaced every `markTestIncomplete()` placeholder with PHPUnit assertions that call the unmodified legacy PHP, and added new test methods for mode-specific rules.
- Pinned tax lookup and compounding, tax descriptions, `tep_add_tax` / `tep_calculate_tax`, rounding, `calculate_price`, currency formatting, specials, attributes, weight and item count.
- Characterized quirks Q-01 (exponent-form rounding), Q-02 (negative rounding), Q-03 (round-then-multiply) and Q-08 (expired specials still applied).
- Took every expected value from `fixtures/golden/` rather than hand calculation.

## Prompt

```text
Task T2 from BOB_TASKS.md. Before anything is modernized, pin down what the legacy PHP does today.

Complete legacy-harness/tests/bob/LegacyPricingTest.php: replace every markTestIncomplete() with real
PHPUnit assertions that call the unmodified legacy code (it is already loaded by tests/bootstrap.php;
read tests/LegacyTestCase.php for the helpers: cart(), useCurrency(), requireMode(), golden(),
assertLegacyNumber()). Cover tax (tep_get_tax_rate, tep_get_tax_description, tep_add_tax,
tep_calculate_tax), cart totals (shoppingCart::calculate with specials and +/- attributes, weight,
count_contents), rounding (tep_round, calculate_price) and currency formatting, including the quirks Q-01,
Q-02, Q-03 and Q-08. You may add more test methods or more *Test.php files in legacy-harness/tests/bob/.

Expected values must be what the legacy code returns today. Cross-check each one with fixtures/golden/
(or docs/business-rules.md) instead of trusting a hand calculation. Use requireMode(true|false) for rules
that only hold in one DISPLAY_PRICE_WITH_TAX mode. Do not modify anything outside legacy-harness/tests/bob/.
Finish when `npm run legacy:test` passes in both modes with no incomplete tests.
```

## Transcript

> Exported from IBM Bob. Every message is kept as exported. Only the formatting was changed: headings inside messages
> are nested one level below the speaker, repeated blank lines are collapsed, and file links point into this repo.

### 👤 User

#### T2: Baseline tests for the legacy business math (Phase 2: Generate Baseline Tests)

- **Mode:** 🧪 CleanCart Legacy Tester
- **Edits:** `legacy-harness/tests/bob/*Test.php`
- **Accept:** `npm run legacy:test` (runs PHPUnit twice: prices without tax, then with tax)
- **Session file:** `docs/bob-sessions/02-legacy-tests.md`

**Prompt**
```text
Task T2 from BOB_TASKS.md. Before anything is modernized, pin down what the legacy PHP does today.

Complete legacy-harness/tests/bob/LegacyPricingTest.php: replace every markTestIncomplete() with real
PHPUnit assertions that call the unmodified legacy code (it is already loaded by tests/bootstrap.php;
read tests/LegacyTestCase.php for the helpers: cart(), useCurrency(), requireMode(), golden(),
assertLegacyNumber()). Cover tax (tep_get_tax_rate, tep_get_tax_description, tep_add_tax,
tep_calculate_tax), cart totals (shoppingCart::calculate with specials and +/- attributes, weight,
count_contents), rounding (tep_round, calculate_price) and currency formatting, including the quirks Q-01,
Q-02, Q-03 and Q-08. You may add more test methods or more *Test.php files in legacy-harness/tests/bob/.

Expected values must be what the legacy code returns today. Cross-check each one with fixtures/golden/
(or docs/business-rules.md) instead of trusting a hand calculation. Use requireMode(true|false) for rules
that only hold in one DISPLAY_PRICE_WITH_TAX mode. Do not modify anything outside legacy-harness/tests/bob/.
Finish when `npm run legacy:test` passes in both modes with no incomplete tests.
```

---

### 🤖 Assistant

> 🔧 called: read_file, read_file

I'll start by thoroughly reading the relevant files before writing any tests.

> 🔧 **read_file** — BOB_TASKS.md

> 🔧 **read_file** — legacy-harness/tests/bob/LegacyPricingTest.php

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — legacy-harness/tests/LegacyTestCase.php

> 🔧 **read_file** — legacy-harness/tests/bootstrap.php

### 🤖 Assistant

> 🔧 called: list_files, list_files

> 🔧 **list_files** — fixtures/golden/functions

> 🔧 **list_files** — legacy-harness

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/tax_rate.json

> 🔧 **read_file** — fixtures/golden/functions/tep_round.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/tep_round.json

> 🔧 **read_file** — fixtures/golden/functions/add_tax.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/tep_round.json

> 🔧 **read_file** — fixtures/golden/functions/add_tax.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/tep_round.json

> 🔧 **read_file** — fixtures/golden/functions/add_tax.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me look at the add_tax cases for `displayPriceWithTax: true`, the calculate_price fixture, cart_calculate, and the tax_description/calculate_tax fixtures:

> 🔧 **read_file** — fixtures/golden/functions/add_tax.json

> 🔧 **read_file** — fixtures/golden/functions/calculate_price.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/calculate_price.json

> 🔧 **read_file** — fixtures/golden/functions/calculate_tax.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/calculate_tax.json

> 🔧 **read_file** — fixtures/golden/functions/tax_description.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/cart_calculate.json

> 🔧 **read_file** — fixtures/golden/functions/format.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/format.json

> 🔧 **read_file** — fixtures/golden/functions/cart_calculate.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/functions/format.json

> 🔧 **read_file** — fixtures/golden/functions/cart_calculate.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me look at the legacy PHP functions to understand their signatures and look at the catalog to understand the data:

> 🔧 **read_file** — fixtures/catalog.json

> 🔧 **read_file** — legacy-harness/lib/bootstrap.php

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/catalog.json

> 🔧 **read_file** — docs/legacy-quirks.md

### 🤖 Assistant

> 🔧 called: grep, read_file

Now let me look at the legacy PHP functions to understand their signatures:

> 🔧 **read_file** — legacy-harness/tests/GoldenFunctionsTest.php

> 🔧 **grep** — function tep_round|function tep_get_tax_rate|function tep_get_tax_description|function tep_add_tax|function tep_calculate_tax|function calculate_price

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now I have a thorough understanding of the codebase. Let me look at a few key specific golden cases that I need for the specific business rule tests, then check the specials/attributes fixture details:

> 🔧 **read_file** — fixtures/golden/functions/cart_calculate.json

> 🔧 **read_file** — fixtures/golden/functions/calculate_price.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me look at one of the specials scenarios for the Q-08 data:

> 🔧 **read_file** — fixtures/golden/functions/calculate_price.json

> 🔧 **read_file** — legacy-harness/scenarios/us-fl-specials.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me look at the golden output for the specials scenario:

> 🔧 **read_file** — legacy-harness/scenarios/us-fl-negative-attribute.json

> 🔧 **read_file** — legacy-harness/scenarios/us-fl-attr-rounding-exclusive.json

### 🤖 Assistant

> 🔧 called: grep

Now I have enough information. Let me look for the actual golden output for specials and negative attributes in cart_calculate:

> 🔧 **grep** — fixtures/golden/functions/cart_calculate.json

### 🤖 Assistant

> 🔧 called: write_file, read_file

I now have comprehensive knowledge of the fixtures and the legacy code structure. Let me write the complete test file:Let me look for a cart_calculate case with specifically the specials products to find exact expected values. Let me search for a case with productId 3 and qty 1 (product 3 has an active special at 39.99):

> 🔧 **read_file** — fixtures/golden/functions/cart_calculate.json

### 🤖 Assistant

> 🔧 called: read_file

> 🔧 **read_file** — fixtures/golden/functions/cart_calculate.json

### 🤖 Assistant

> 🔧 called: write_file

I now have all the data I need. Now I can write the complete test file. Let me verify a few specific expected values I'll use in the tests:

- Product 3 (MSIMPRO, $49.99, special status=1 at $39.99) qty=1, USD, no tax class (tax_class_id=1, FL store), displayPriceWithTax=false → from cart_calculate: productId 3 + productId 22 qty 2 + productId 4 qty 7 = 513.97; product 3 alone isn't directly available in a simple test. Let me use calculate_price directly to test specials via the cart.

Actually, `calculate_price` in the currencies class doesn't care about specials - it just calculates price. The specials affect `shoppingCart` which looks up the product price from DB. Let me check what `show_total()` returns vs `calculate_price`. Let me look for a single-product cart with product 3 in USD:

From the fixture at line 1235-1274: product 27 qty 1, product 3 qty 1, product 1 qty 2 (attr optionId=3 valueId=5, optionId=4 valueId=1), product 30 qty 12 → total=1379.96. I need a simpler case. Looking at line 628-669: product 3 qty 12 + product 16 qty 2 + product 25 qty 3 attr (optionId=1, valueId=15) + product 25 qty 1 + product 4 qty 1 → total=419 (JPY).

I'll derive the test from golden fixture cases for specials and then compute the expected manually from first principles. Actually, for the specials test I should use `cart()` → `show_total()` and assert against the value from a known fixture case.

Looking at USD, product 5 (Blade Runner, $35.99, special at $30.00 status=1, active): from cart_calculate fixture, line 891-907, USD, product 5 qty 7 → total=210. That's 7 × $30 = $210. And product 16 (Courage Under Fire, $38.99, special at $29.99 status=1, active) confirms the special price is used.

For status=0 special (product 1, Matrox G200, $299.99, special at $249.99 status=0): should use full price $299.99.

For expired special (product 7, You've Got Mail, $34.99, special at $19.99 status=1 but expires_date='2001-01-01'): Q-08 says the expired special is still applied because status=1. So product 7 qty 1 → price should be $19.99.

Now I have everything needed. Let me write the complete test:

> 🔧 **write_file** — legacy-harness/tests/bob/LegacyPricingTest.php

### 🤖 Assistant

> 🔧 called: execute_command

Now let's run the tests:

> 🔧 **execute_command** — npm run legacy:test 2>&1

### 🤖 Assistant

> 🔧 called: read_file, read_file

Good — two failures to fix. Let me investigate each one carefully.

**Failure 1**: `tep_round(-0.5, 0)` → actual `'1'` not `'0'`. Let me look at the tep_round golden fixture for this exact case:

> 🔧 **read_file** — fixtures/golden/functions/tep_round.json

> 🔧 **read_file** — legacy-baseline/catalog/includes/functions/general.php

### 🤖 Assistant

> 🔧 called: read_file

The fixture says `tep_round(-0.5, 0)` → `"1"`. The legacy code for `-0.5` at precision 0: `strpos("-0.5", '.')` = 2 (truthy). `strlen(substr("-0.5", 3)) = strlen("5") = 1 > 0` → true. `$number = substr("-0.5", 0, 2+1+0+1) = substr("-0.5", 0, 4) = "-0.5"`. Last char is `"5"` >= 5, precision == 0, so `$number = substr("-0.5", 0, -1) + 1 = "-0." + 1`. PHP evaluates `"-0."` as `-0.0` = `0`, so `0 + 1 = 1`. The fixture confirms: `"1"`.

My comment in the test was wrong. The expected value should be `'1'`, not `'0'`. Fix that.

**Failure 2**: `calculate_price('10.0050', 20, 2)` with JPY in `displayPriceWithTax=true` mode → actual `'24'` not `'20'`. When `DISPLAY_PRICE_WITH_TAX=true`, `tep_add_tax('10.0050', 20)` = `10.0050 * (1 + 20/100) = 10.0050 * 1.20 = 12.006`. Then `tep_round(12.006, 0)` = 12 (JPY 0 decimals). 12 × 2 = 24. So in the `true` mode, this case should give `'24'`. I need to use `requireMode(false)` before that first JPY assertion, or pick a different test case.

Let me look at a JPY calculate_price fixture case that works in both modes (or use `displayPriceWithTax=false` only):

> 🔧 **read_file** — fixtures/golden/functions/calculate_price.json

### 🤖 Assistant

> 🔧 called: apply_diff

Good — both of my test cases are `displayPriceWithTax: false` cases. The `requireMode(false)` call needs to come BEFORE the JPY case, not after it. The test currently calls `useCurrency('JPY')` first, then `requireMode(false)` – but `requireMode` only skips, it doesn't stop the JPY assertion already made. Also in the `true` run, the test reaches the JPY assertion before skipping.

The fix is to put `requireMode(false)` at the top of that test, since ALL the `calculate_price` fixture cases in that test are `displayPriceWithTax: false`. Let me fix both issues:

> 🔧 **apply_diff** — legacy-harness/tests/bob/LegacyPricingTest.php

### 🤖 Assistant

> 🔧 called: execute_command

> 🔧 **execute_command** — npm run legacy:test 2>&1

### 🤖 Assistant

> 🔧 called: grep

All tests pass in both modes. Let me verify the skip count is acceptable (no `markTestIncomplete` remains, only legitimate `requireMode` skips):

> 🔧 **grep** — legacy-harness/tests/bob/LegacyPricingTest.php

### 🤖 Assistant

> 🔧 called: execute_command

No `markTestIncomplete` calls remain — only in the comment. The skips are all from `requireMode()` calls inside specific tests (mode-dependent). Let me verify the acceptance criterion explicitly:

> 🔧 **execute_command** — npm run check:protected 2>&1

### 🤖 Assistant

All protected files are unchanged. The acceptance command passes and no protected files were modified.

---

Here's a summary of what was done and why:

#### What was changed

**[`legacy-harness/tests/bob/LegacyPricingTest.php`](../../legacy-harness/tests/bob/LegacyPricingTest.php)**

Every `markTestIncomplete()` was replaced with real PHPUnit assertions against the live legacy code. The original method stubs were preserved; three new methods were added (`testBR05AddTaxWhenDisplayPriceWithTaxFalse`, `testBR05AddTaxWhenDisplayPriceWithTaxTrue`, `testBR06CalculateTaxNeverRounds`) to separate the two mode-dependent halves of BR-05 cleanly.

##### Test-by-test rationale

| Method | BR/Q ids | What it pins |
|---|---|---|
| `testBR01TepRoundTruncatesTheStringForm` | BR-01 | Half-up string-truncation rounding, both float and DB string inputs. All values from `tep_round.json`. |
| `testQ01TepRoundExponentForm` | Q-01 | `0.00001` → PHP serialises as `"1.0E-5"` → `tep_round` garbles it to `"1"` at precision 2, returns the raw exponent string `"1.0E-5"` at precision 4. Also the 1e15 large-number case. |
| `testQ02TepRoundNegativeNumbers` | Q-02 | Negative numbers round toward positive infinity. `-0.5` at precision 0 is the subtlest case: the truncated string `"-0."` + 1 = 1, not −1 or 0. |
| `testBR02AndBR03TaxRateLookupAndCompounding` | BR-02, BR-03 | FL (single), CA (zero), NY (summed 4+4.5=8.5), ON HST (13), QC compounded (15.47375), DE (two classes), unknowns. All from `tax_rate.json`. |
| `testBR04TaxDescription` | BR-04 | Joined descriptions, `TEXT_UNKNOWN_TAX_RATE` fallback. From `tax_description.json`. |
| `testBR05AddTaxWhenDisplayPriceWithTaxFalse` | BR-05 | `requireMode(false)` — `tep_add_tax` returns price unchanged. |
| `testBR05AddTaxWhenDisplayPriceWithTaxTrue` | BR-05 | `requireMode(true)` — `tep_add_tax` returns price×(1+rate/100). |
| `testBR06CalculateTaxNeverRounds` | BR-06 | `tep_calculate_tax` = price×rate/100 with no rounding, mode-independent. |
| `testBR07CalculatePriceRoundsUnitPriceBeforeQuantity` | BR-07, Q-03 | `requireMode(false)` (all cases are exclusive-mode). Round unit price first, then multiply — the key Q-03 accumulation bug. From `calculate_price.json`. |
| `testBR08CurrencyFormat` | BR-08 | USD/EUR/JPY formatting with `calculate_currency_value` true/false, from `format.json`. EUR `","` decimal separator and JPY 0 decimal places. |
| `testBR09AndQ08Specials` | BR-09, Q-08 | `requireMode(false)`. Active special (product 5/3) used; `status=0` special (product 1) ignored; **expired but `status=1`** special (product 7, `expires_date='2001-01-01'`) still applied — the Q-08 bug. |
| `testBR10AndBR12CartAttributesWeightAndCount` | BR-10, BR-12 | `requireMode(false)`. Five sub-cases: `+` attribute, `−` attribute, four-decimal `+2.4950`, four-decimal `−1.3333`, and a mixed-cart golden fixture. Weight and `count_contents()` verified. |
