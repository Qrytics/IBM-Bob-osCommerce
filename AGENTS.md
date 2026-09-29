# AGENTS.md: rules for AI agents (IBM Bob) in this repository

This repo modernizes the osCommerce v2.3.4 checkout math into a Node.js REST API.
**Everything except the AI tasks is already built.** Your job is only the tasks in
[`BOB_TASKS.md`](BOB_TASKS.md), **one at a time, in order**, each in the project mode it names.

## The one rule that matters

> The modern code must reproduce the legacy PHP results **exactly, bugs included**.
> The golden fixtures in `fixtures/golden/` were recorded from the unmodified PHP.
> They are the specification. When your code and a fixture disagree, **your code is wrong**.

## What you may edit (enforced by the modes in `.bob/custom_modes.yaml`)

| Mode | Tasks | Files it may edit |
|---|---|---|
| 📖 CleanCart Analyst (`cc-analyst`) | T1, T10 | `docs/business-rules.md`, `docs/legacy-quirks.md`, `docs/architecture-legacy.md`, `docs/architecture-modern.md`, `docs/bob-sessions/*` |
| 🧪 CleanCart Legacy Tester (`cc-legacy-tests`) | T2 | `legacy-harness/tests/bob/*Test.php` |
| 🔁 CleanCart Translator (`cc-translator`) | T3–T9 | `api/src/domain/{general,tax,currency,cart,order}.js`, `api/src/domain/shipping/{index,flat,item,table}.js`, `api/src/domain/orderTotals/{index,subtotal,shipping,tax,total}.js` |
| ✅ CleanCart Unit Tester (`cc-unit-tests`) | T11 | `api/test/unit/*.test.js` |

**Every other file is protected.** `npm run check:protected` hashes all of them, and
`npm test` / `npm run verify` / CI fail if any changes. That includes changes made through the
terminal (`sed`, `git checkout`, `npm install`, `echo >`).

## Never

- Never edit, move, delete or regenerate anything under `legacy-baseline/`, `fixtures/`,
  `legacy-harness/lib|bin|scenarios`, `api/test/equivalence|api|infra`, `api/src/http|data|verify`,
  `api/src/domain/{phpNumber,types,constants,errors,index}.js`, `scripts/`, `.bob/`, `.github/`,
  or any `package.json` / lock file.
- Never run `npm run golden:generate`, `npm run protect:update`, `npm install <anything>` or `git commit`.
- Never change an expected value, a fixture, or a test you did not write to make a check pass.
- Never "fix" a legacy quirk. Quirks are requirements (see `docs/legacy-quirks.md` and the Q-ids in the stubs).
- Never hard-code answers: no lookup tables, no reading fixtures from domain code, no `if (input === …) return …`.
  ESLint rules and a fresh random hold-out set (`npm run holdout`) catch this.
- Never rename exported functions or change their signatures. `api/src/domain/index.js`, the
  HTTP routes and the tests call them exactly as the stubs declare.
- Never add dependencies or new files outside your mode's allowlist.
- Never use `test.skip`, `.only`, `istanbul ignore`, or `eslint-disable` (except the
  `eslint-disable-next-line no-unused-vars` lines already in the stubs, which you should delete once the import is used).

## Always

- Read the stub first. Its JSDoc names the legacy file and line, the business rules (BR-xx),
  the quirks (Q-xx), and the exact input and output shapes (`api/src/domain/types.js`).
- Read the legacy code it cites under `legacy-baseline/catalog/includes/`.
- Reproduce PHP semantics with `api/src/domain/phpNumber.js`:
  - `phpToString(x)`: wherever PHP turns a number into a string (`.` concatenation, `strpos`, `substr`, `str_replace` on a number).
  - `phpToNumber(x)`: wherever PHP turns a string into a number (arithmetic on DB strings, `"abc" >= 5`, `(float)`).
  - `phpNumberFormat(...)`: PHP `number_format()`.
- Run the task's check command after every change, and look at the first failing case: it shows
  the input, the legacy value and your value.
- Stop when the task's acceptance command passes. Then do the next task in `BOB_TASKS.md`.

## Useful commands

```bash
npm run status              # progress per module, and what to do next
npm run check:<module>      # one module: general | tax | currency | cart | order | shipping | ot
npm run lint                # includes the domain purity and anti-answer-table rules
npm run legacy:test         # PHPUnit on the real legacy PHP (T2)
npm run check:docs -- --stage analysis   # T1 docs
npm run verify              # everything (the final gate)
```

## Where things are

- `legacy-baseline/`: unmodified osCommerce v2.3.4 source (read-only).
- `legacy-harness/`: runs the real legacy PHP (PHP 7.4 via WebAssembly) with an in-memory DB.
- `fixtures/catalog.json`: the demo store's database rows. `fixtures/golden/`: recorded legacy outputs.
- `api/src/domain/`: the pure business logic (your translation target).
- `api/src/verify/checks.js`: exactly how each module is checked against the fixtures.
