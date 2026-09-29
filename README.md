# CleanCart: modernizing osCommerce with IBM Bob

I used IBM Bob to modernize the checkout math of osCommerce v2.3.4, where pricing, SQL and HTML share the same
PHP files. Bob analyzed the legacy code, pinned its behavior with PHPUnit, translated it into a decoupled
Node.js REST API and wrote the unit tests. The API reproduces the legacy results exactly, bugs included, and
that is proven against 2,296 outputs recorded from the untouched PHP.

**Team:** I-will-win (Mario, solo) · **Track:** Modernize what matters

**Live demo:** [cleancart-api.onrender.com](https://cleancart-api.onrender.com) · [Swagger UI](https://cleancart-api.onrender.com/docs/) · [live equivalence report](https://cleancart-api.onrender.com/api/v1/equivalence)

> The demo runs on Render's free plan. If it has been idle, the first request can take 30–60 seconds while the
> instance wakes up; after that it responds instantly. A scheduled GitHub Action pings `/health` to keep it awake.

## The idea in one picture

```mermaid
flowchart LR
  subgraph Legacy["legacy-baseline/ (osCommerce v2.3.4, unmodified PHP)"]
    P[shopping_cart.php · checkout_*.php<br/>HTML + SQL + math in one file]
  end
  subgraph Harness["legacy-harness/ (PHP 7.4, in-memory DB)"]
    H[run the real legacy code<br/>on 54 checkouts + 2,200 function cases]
  end
  G[(fixtures/golden<br/>recorded legacy outputs)]
  subgraph Modern["api/ (Node.js + Express)"]
    D[pure domain modules<br/>translated by IBM Bob] --> R[REST API · Swagger · demo UI]
  end
  P --> H --> G
  G -- "bit-for-bit equivalence tests<br/>(Jest, no tolerance)" --> D
```

1. **Baseline:** the untouched osCommerce v2.3.4 source lives in [`legacy-baseline/`](legacy-baseline/SOURCE.md).
2. **Ground truth:** [`legacy-harness/`](legacy-harness/README.md) runs that PHP for real (PHP 7.4, no MySQL
   needed) and records every intermediate value of 54 checkouts plus ~2,200 direct function calls into
   [`fixtures/golden/`](fixtures/README.md).
3. **AI modernization:** IBM Bob analyzes the PHP, documents its business rules and quirks, writes baseline
   tests, and translates the logic into pure JavaScript modules, one module at a time
   ([`BOB_TASKS.md`](BOB_TASKS.md)).
4. **Proof:** every golden value must be reproduced **exactly**, with no tolerance, including 10 documented
   legacy quirks. A fresh random hold-out set from the PHP blocks memorised answers.
5. **API:** stateless REST endpoints with validation, Swagger docs and a demo UI that shows the legacy and
   modern results side by side.

## Repository map

| Path | What |
|---|---|
| `legacy-baseline/` | osCommerce v2.3.4 source, unmodified (the "before") |
| `legacy-harness/` | Runs the legacy PHP: fake DB, page-flow runner, PHPUnit characterization tests |
| `fixtures/` | Demo catalog + golden legacy outputs (generated, never hand-edited) |
| `api/src/domain/` | Pure business logic: tax, rounding, currency, cart, order, shipping, order totals |
| `api/src/http/` | Express app, routes, zod validation, error handling |
| `api/src/verify/` | Equivalence checks shared by the tests, `npm run status` and `/api/v1/equivalence` |
| `api/test/` | Jest: equivalence (golden), API, infrastructure, and unit tests |
| `api/public/` | Demo UI (served at `/`) |
| `docs/` | Plan, business rules, quirks, architecture (legacy and modern), Bob session logs |
| `BOB_TASKS.md`, `AGENTS.md`, `.bob/` | The IBM Bob playbook, agent rules and project modes |

## Run it locally

Requires Node.js 20+ (24 recommended). **No PHP, MySQL or Docker needed.**

```bash
npm install
npm test            # protected-files check + all Jest suites
npm start           # http://localhost:3000  (UI)  ·  /docs (Swagger)  ·  /api/v1/equivalence
```

More commands:

```bash
npm run status          # translation progress per module
npm run verify          # the full gate: protected files, lint, integrity, docs, tests, 100% domain coverage
npm run legacy:test     # PHPUnit against the real legacy PHP (both tax display modes)
npm run golden:verify   # re-run the PHP and confirm the committed fixtures byte-for-byte
npm run holdout         # fresh random legacy cases → equivalence check (anti-overfitting)
```

## API at a glance

| Method | Path | Legacy equivalent |
|---|---|---|
| `POST` | `/api/v1/tax/rate` | `tep_get_tax_rate()` + `tep_get_tax_description()` |
| `POST` | `/api/v1/cart/calculate` | `shoppingCart::calculate()` (the cart page) |
| `POST` | `/api/v1/checkout/totals` | `checkout_shipping.php` → `checkout_confirmation.php`: order, shipping, `ot_*` modules |
| `GET` | `/api/v1/products`, `/api/v1/reference` | catalog and reference data |
| `GET` | `/api/v1/scenarios/{name}/compare` | one golden checkout, legacy vs. modern |
| `GET` | `/api/v1/equivalence` | every golden case re-checked live |

## How IBM Bob was used

See [`BOB_TASKS.md`](BOB_TASKS.md) for the 11 tasks and exact prompts, and
[`docs/bob-sessions/`](docs/bob-sessions/) for the transcripts. Bob works in four project modes
([`.bob/custom_modes.yaml`](.bob/custom_modes.yaml)). Each mode can only edit the files of its task, and
everything else is protected by a SHA-256 manifest checked in CI.

| Mode | Tasks | What Bob produced |
|---|---|---|
| 📖 Analyst | T1, T10 | 28 business rules, 10 legacy quirks, legacy and modern architecture docs |
| 🧪 Legacy Tester | T2 | PHPUnit characterization tests on the real legacy PHP, in both tax-display modes |
| 🔁 Translator | T3–T9 | the 14 domain modules in `api/src/domain/`: every line of the translated business logic |
| ✅ Unit Tester | T11 | 170 Jest unit tests naming BR-01..BR-28, 100% coverage of the translated files |

## How this was built (AI tools used)

Two AI tools were used, with a deliberate split:

- **IBM Bob did the modernization itself:** the analysis and documentation, the legacy baseline tests, the
  translation of the business logic, and the unit tests (the table above). Its sessions are in
  [`docs/bob-sessions/`](docs/bob-sessions/).
- **Claude Code prepared the safety net before Bob started:** the unmodified legacy baseline, the PHP 7.4
  WebAssembly harness, the golden fixtures recorded from it, the API scaffolding (HTTP layer, data access,
  stubbed domain functions), the equivalence checks, the guardrails (Bob modes, protected-file manifest,
  integrity and lint rules), the demo UI, CI and deployment. It also committed and pushed the work, which is why
  "Claude" appears as a co-author on commits, including the one that holds Bob's T1–T11 output.

The split was on purpose: the oracle and the guardrails that judge the AI's work should not be written by the AI
being judged. When Bob hit a genuine bug in those guardrails during T11 (an integrity rule that flagged a comment),
it stopped and reported it instead of working around it; the fix is commit `528a533`.

## Tech stack

| Layer | Tools |
|---|---|
| AI | IBM Bob (4 custom modes, 11 tasks); Claude Code for scaffolding and guardrails |
| Legacy baseline | osCommerce Online Merchant v2.3.4 (PHP), run on PHP 7.4 via WebAssembly (`@php-wasm/cli`), PHPUnit 9 |
| Modern API | Node.js 24, Express 4, OpenAPI 3 with Swagger UI (`swagger-ui-express`), plain-JS demo UI |
| Quality | Jest (unit, equivalence, API tests), ESLint (incl. anti-lookup-table rules), SHA-256 protected-file manifest |
| Delivery | GitHub Actions (CI and keep-alive), Render (Blueprint in `render.yaml`) |

## Maintainers

Protected files (everything Bob may not edit) are recorded in `scripts/protected.sha256`. After an
intentional change to one of them, for example adding the live URL to this README, run
`npm run protect:update` and commit the manifest.

## License

GPL-2.0, like osCommerce itself (the API is a translation of GPL code). See [`LICENSE`](LICENSE).
