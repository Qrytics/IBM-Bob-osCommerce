# BOB_TASKS.md: the IBM Bob playbook

Everything that doesn't need AI is already built: the legacy baseline, the PHP harness, the
golden fixtures, the API, the tests, the demo UI, CI and deployment. These 11 tasks are the
part IBM Bob does. They map to Phase 2 of `docs/overviewPlan.md`.

**How to run a task**
1. In Bob, switch to the **mode** the task names (Bob loads the project modes from `.bob/custom_modes.yaml`).
2. Paste the **prompt**.
3. Let Bob work until the **accept** command passes. Bob runs it itself, and you can run it too.
4. Save the conversation (export or copy) to the **session file** for the demo video and the judges.
5. Commit: `git add -A && git commit -m "T<n>: <title>"`. `npm run check:protected` must still pass.

Progress at any time: `npm run status` (terminal) or `/` in the running app (`npm start`).

If Bob wanders outside its task: stop it, and run `npm run check:protected`. If anything is
reported, restore it with `git checkout -- <file>` and start the task again.

---

## T1: Analyze and document the legacy code (Phase 2: Analyze & Document)

- **Mode:** 📖 CleanCart Analyst
- **Edits:** `docs/business-rules.md`, `docs/legacy-quirks.md`, `docs/architecture-legacy.md`
- **Accept:** `npm run check:docs -- --stage analysis`
- **Session file:** `docs/bob-sessions/01-analysis.md`

**Prompt**
```text
Task T1 from BOB_TASKS.md. Analyze the legacy osCommerce v2.3.4 checkout pricing code and fill in the three
documentation templates.

Read, in legacy-baseline/catalog/: shopping_cart.php, checkout_shipping.php, checkout_confirmation.php,
checkout_process.php, includes/functions/general.php (tep_round, tep_get_tax_rate, tep_get_tax_description,
tep_add_tax, tep_calculate_tax), includes/classes/{shopping_cart,order,currencies,shipping,order_total}.php,
includes/modules/shipping/{flat,item,table}.php and includes/modules/order_total/ot_{subtotal,shipping,tax,total}.php.

1. docs/business-rules.md: for each BR-01..BR-28, replace the two TODO(bob) markers with a precise
   plain-language rule and a worked example that uses real numbers from the "Golden evidence" file named
   in that section (open the file in fixtures/golden/ and quote the input and the legacy output).
2. docs/legacy-quirks.md: for each Q-01..Q-10, explain the mechanism (line and PHP conversion), give the
   legacy result vs. the mathematically expected one with real numbers, and describe a future fix.
3. docs/architecture-legacy.md: overview, a Mermaid diagram of the request flow through the pages,
   classes, functions and tables, a coupling table (File | HTML output | SQL queries | Business math |
   Globals/session) with a short code excerpt, the data the slice reads, and the risks of changing it.

Keep every heading, id, "Legacy" and "Golden evidence" line exactly as they are. Do not guess: verify every
statement against the PHP source or the fixtures. Finish when `npm run check:docs -- --stage analysis` passes.
```

---

## T2: Baseline tests for the legacy business math (Phase 2: Generate Baseline Tests)

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

## T3–T9: Translate the business logic (Phase 2: Refactoring & Extraction)

- **Mode:** 🔁 CleanCart Translator (all seven tasks)
- **Session files:** `docs/bob-sessions/03-general.md` … `09-order-totals.md`

Use the same prompt for each task and change only the task line (T3 … T9):

| Task | Module | Files | Accept |
|---|---|---|---|
| T3 | general | `api/src/domain/general.js` | `npm run check:general` |
| T4 | tax | `api/src/domain/tax.js` | `npm run check:tax` |
| T5 | currency | `api/src/domain/currency.js` | `npm run check:currency` |
| T6 | cart | `api/src/domain/cart.js` | `npm run check:cart` |
| T7 | order | `api/src/domain/order.js` | `npm run check:order` |
| T8 | shipping | `api/src/domain/shipping/{index,flat,item,table}.js` | `npm run check:shipping` |
| T9 | ot | `api/src/domain/orderTotals/{index,subtotal,shipping,tax,total}.js` | `npm run check:ot` |

**Prompt** (T4 shown)
```text
Task T4 from BOB_TASKS.md: translate the tax module.

Open the stub(s) for this task in api/src/domain/ and read their JSDoc: it cites the legacy PHP file and
lines, the business rules (BR-xx in docs/business-rules.md) and the quirks (Q-xx in docs/legacy-quirks.md).
Read that PHP in legacy-baseline/catalog/includes/, then replace every `throw new NotImplemented(...)`
with a faithful JavaScript translation.

Requirements:
- Reproduce the legacy results exactly, quirks included. The fixtures in fixtures/golden/ were recorded
  from the real PHP and are compared without tolerance.
- Use phpToString / phpToNumber / phpNumberFormat from api/src/domain/phpNumber.js wherever PHP converted
  between strings and numbers implicitly (see .bob/rules-cc-translator/01-php-semantics.md).
- Keep every export name and signature; keep the code pure (no I/O, no fixture reads, no lookup tables).
- Explain each function: which legacy lines it mirrors and which BR-/Q-ids it implements.

Run `npm run check:tax` after each change and use the first failing case (input, legacy value, your value)
to guide the fix. Finish when `npm run check:tax` and `npm run lint` both pass.
```

After T9: `npm run status` shows every module ✔ and `npm run check:pipeline` is green (the whole
checkout through the API).

---

## T10: Document the modern architecture

- **Mode:** 📖 CleanCart Analyst
- **Edits:** `docs/architecture-modern.md`
- **Accept:** `npm run check:docs -- --stage modern`
- **Session file:** `docs/bob-sessions/10-architecture-modern.md`

**Prompt**
```text
Task T10 from BOB_TASKS.md. Fill in docs/architecture-modern.md for the modernized CleanCart API: overview,
a Mermaid diagram of the layers (api/src/http routes + validation → api/src/domain pure modules → api/src/data),
a Legacy to modern mapping table covering every function in general.js, tax.js, currency.js, cart.js,
order.js, shipping/ and orderTotals/ with their BR-ids, how equivalence is proven (legacy-harness,
fixtures/golden, phpNumber.js, api/src/verify/checks.js, the hold-out set, GET /api/v1/equivalence) and how to
extend the API safely (e.g. a "corrected" mode for the quirks behind a flag). Base everything on the actual
code. Keep the headings. Finish when `npm run check:docs -- --stage modern` passes.
```

---

## T11: Unit tests for the new API (Phase 2: Verify & Test)

- **Mode:** ✅ CleanCart Unit Tester
- **Edits:** `api/test/unit/*.test.js`
- **Accept:** `npm run verify` (everything: protected files, lint, integrity, docs, all tests, **100% coverage** of the translated files)
- **Session file:** `docs/bob-sessions/11-unit-tests.md`

**Prompt**
```text
Task T11 from BOB_TASKS.md. Write Jest unit tests in api/test/unit/ (one file per module, e.g. tax.test.js)
that document and prove each business rule of the modernized domain code.

- Put the rule id in every test name, e.g. test('BR-07 rounds the unit price before multiplying by quantity').
  Every id BR-01..BR-28 must appear at least once. Cite Q-ids for quirk tests.
- Take expected values from fixtures/golden/ (quote the fixture file in a comment), never from running the
  code under test.
- Call the domain functions directly (require('../../src/domain/tax') etc.) with small, readable inputs and
  the real catalog (require('../../../fixtures/catalog.json')).
- Reach 100% line and branch coverage of every translated file, including the defensive branches (missing
  attribute rows, zero tax, unknown locations, empty carts).
- No test.skip/.only, no coverage-ignore comments, do not edit any other file.
Finish when `npm run verify` passes.
```

---

## Done: Phase 3 (deployment)

1. `npm run verify && npm run holdout && npm run legacy:test && npm run golden:verify`: all green.
2. Push, then on Render create **New → Blueprint** from this repo (`render.yaml`). Wait for `/health`.
3. Put the live URL in `README.md` (then `npm run protect:update` and commit), and open `/`, `/docs` and
   `/api/v1/equivalence` on the live site for the demo.
