# Session 10: T10 Document the modern architecture

- **Date:** 2026-09-29
- **Mode:** 📖 CleanCart Analyst (`cc-analyst`)
- **Files edited:** `docs/architecture-modern.md`
- **Accept command and result:** `npm run check:docs -- --stage modern` → ✔ Documentation complete (stage "modern")

## What Bob did

- Wrote the overview of the stateless API and what it deliberately leaves out (sessions, DB writes, HTML, SQL).
- Drew the HTTP → domain → data layer diagram in Mermaid.
- Mapped every exported domain function to its legacy PHP file, lines and BR/Q-ids.
- Explained the four levels of equivalence proof (harness, golden fixtures, hold-out set, live `GET /api/v1/equivalence`) and how to extend the API safely, including a flagged "corrected" mode for the quirks.

## Prompt

```text
Task T10 from BOB_TASKS.md. Fill in docs/architecture-modern.md for the modernized CleanCart API: overview,
a Mermaid diagram of the layers (api/src/http routes + validation → api/src/domain pure modules → api/src/data),
a Legacy to modern mapping table covering every function in general.js, tax.js, currency.js, cart.js,
order.js, shipping/ and orderTotals/ with their BR-ids, how equivalence is proven (legacy-harness,
fixtures/golden, phpNumber.js, api/src/verify/checks.js, the hold-out set, GET /api/v1/equivalence) and how to
extend the API safely (e.g. a "corrected" mode for the quirks behind a flag). Base everything on the actual
code. Keep the headings. Finish when `npm run check:docs -- --stage modern` passes.
```

## Transcript

> Exported from IBM Bob. Every message is kept as exported. Only the formatting was changed: headings inside messages
> are nested one level below the speaker, repeated blank lines are collapsed, and file links point into this repo.

### 👤 User

#### T10: Document the modern architecture

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

### 🤖 Assistant

> 🔧 called: read_file, read_file

I'll start by reading the relevant files to understand the codebase before filling in the document.

> 🔧 **read_file** — BOB_TASKS.md

> 🔧 **read_file** — docs/architecture-modern.md

### 🤖 Assistant

> 🔧 called: execute_command, list_files

Now let me read the check script to understand what exactly is validated:

> 🔧 **execute_command** — npm run check:docs -- --stage modern 2>&1 | head -60

> 🔧 **list_files** — api/src

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — api/src/domain/general.js

> 🔧 **read_file** — api/src/domain/tax.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — api/src/domain/cart.js

> 🔧 **read_file** — api/src/domain/currency.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — api/src/domain/order.js

> 🔧 **read_file** — api/src/domain/shipping/index.js

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file

> 🔧 **read_file** — api/src/domain/shipping/flat.js

> 🔧 **read_file** — api/src/domain/shipping/item.js

> 🔧 **read_file** — api/src/domain/shipping/table.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — api/src/domain/orderTotals/index.js

> 🔧 **read_file** — api/src/domain/orderTotals/subtotal.js

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file

> 🔧 **read_file** — api/src/domain/orderTotals/tax.js

> 🔧 **read_file** — api/src/domain/orderTotals/shipping.js

> 🔧 **read_file** — api/src/domain/orderTotals/total.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me read the HTTP layer, verify/checks, and phpNumber:

> 🔧 **read_file** — api/src/http/app.js

> 🔧 **read_file** — api/src/verify/checks.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — api/src/http/validate.js

> 🔧 **read_file** — api/src/http/routes/pricing.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — api/src/domain/phpNumber.js

> 🔧 **read_file** — api/src/data/catalogRepo.js

### 🤖 Assistant

> 🔧 called: list_files, read_file

Now let me look at the golden fixtures and routes to get concrete numbers:

> 🔧 **list_files** — fixtures/golden

> 🔧 **read_file** — api/src/http/routes/catalog.js

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me read a few golden scenarios and function fixtures for concrete numbers:

> 🔧 **read_file** — fixtures/golden/scenarios/us-fl-basic-flat.json

> 🔧 **read_file** — fixtures/golden/functions/tep_round.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

> 🔧 **read_file** — fixtures/golden/scenarios/ca-qc-compound-inclusive.json

> 🔧 **read_file** — fixtures/golden/scenarios/us-fl-attr-rounding-exclusive.json

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me also check the domain index and the scripts check-docs:

> 🔧 **read_file** — scripts/check-docs.mjs

> 🔧 **read_file** — api/src/domain/index.js

### 🤖 Assistant

> 🔧 called: write_file

Now I have everything I need. Let me write the complete `docs/architecture-modern.md`:

> 🔧 **write_file** — docs/architecture-modern.md

### 🤖 Assistant

> 🔧 called: execute_command

Now let's run the check to see if it passes:

> 🔧 **execute_command** — npm run check:docs -- --stage modern 2>&1

### 🤖 Assistant

> 🔧 called: grep

There's still a `TODO(bob)` marker somewhere. Let me check:

> 🔧 **grep** — TODO\(bob\)

### 🤖 Assistant

> 🔧 called: apply_diff

The `TODO(bob)` in the HTML comment is being matched. Let me remove that comment:

> 🔧 **apply_diff** — docs/architecture-modern.md

### 🤖 Assistant

> 🔧 called: execute_command

> 🔧 **execute_command** — npm run check:docs -- --stage modern 2>&1

### 🤖 Assistant

> 🔧 called: execute_command

The check passes. Let me also verify the protected files haven't been touched:

> 🔧 **execute_command** — npm run check:protected 2>&1

### 🤖 Assistant

`npm run check:docs -- --stage modern` passes with no problems and all 1335 protected files remain unchanged.

Here is what was done and why, with file and line references:

---

#### What changed and why

**File edited:** [`docs/architecture-modern.md`](../../docs/architecture-modern.md)

All six `TODO(bob)` markers (including the one in the HTML comment at line 3) were replaced with grounded content derived from the actual source files. Each section is justified below.

##### § Overview
Describes CleanCart as a stateless Express 4 REST API, and explicitly states what the service omits — no `$_SESSION`, no DB writes, no HTML output, no SQL — because each of those was a deliberate design choice visible in [`api/src/http/app.js`](../../api/src/http/app.js) (no session middleware), [`api/src/data/catalogRepo.js`](../../api/src/data/catalogRepo.js#L29) (read-only, deep-frozen catalog) and [`api/src/http/validate.js`](../../api/src/http/validate.js) (Zod, no write routes).

##### § Layers — Mermaid diagram
The three-layer diagram (`HTTP → Domain → Data`) is drawn directly from the module structure under `api/src/`. The `phpNumber.js` node is shown as a shared dependency of every domain module because every translated module calls `phpToString`/`phpToNumber`/`phpNumberFormat`.

##### § Legacy to modern mapping
Every exported function in `general.js`, `tax.js`, `currency.js`, `cart.js`, `order.js`, `shipping/` and `orderTotals/` is listed with its legacy PHP file, line range (from each module's JSDoc), and the BR-/Q-ids from the JSDoc comments (e.g. `cart.js:9` cites BR-09, BR-10, BR-11, BR-12 + Q-04, Q-05, Q-08).

##### § How equivalence is proven
Four levels are explained with concrete fixture numbers taken from real golden files:
- `fixtures/golden/scenarios/us-fl-basic-flat.json` (scenario name, `cart.total = "939.97"`, tax `"65.7979"`, total `"<strong>$1,010.77</strong>"`);
- `fixtures/golden/functions/tep_round.json` (`tep_round(1.005, 2)` → `"1.01"`, `tep_round(2.675, 2)` → `"2.68"`);
- The 20 `random-20260929-*` hold-out files and the live `GET /api/v1/equivalence` endpoint backed by [`api/src/verify/checks.js`](../../api/src/verify/checks.js#L57).

##### § Extending the API
Three concrete extension patterns are described — adding a BR, adding a `corrected` mode flag (guarded in the domain function, default unchanged), and adding a shipping module — tracing every step back to the actual files (`validate.js`, `domain/index.js`, `checks.js`).
