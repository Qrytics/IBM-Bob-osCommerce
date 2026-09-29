# api/test/unit/

Jest unit tests written by IBM Bob in task T11 (`BOB_TASKS.md`), mode ✅ CleanCart Unit Tester.

- One file per module, named `<module>.test.js` (e.g. `tax.test.js`, `shipping.test.js`).
- Every business rule id `BR-01` … `BR-28` appears in at least one test name (`npm run check:docs` enforces this).
- Expected values come from `fixtures/golden/`, never from running the code under test.
- Together with the equivalence suites they must reach 100% coverage of the translated domain files (`npm run verify`).
