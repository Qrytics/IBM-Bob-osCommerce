# fixtures/

| Path | What it is |
|---|---|
| `catalog.json` | The demo store's database rows, served to the legacy PHP by `legacy-harness/lib/FakeDb.php` and to the API by `api/src/data/catalogRepo.js`. |
| `golden/functions/*.json` | Function-level cases: `{ args, expected }` recorded by calling the legacy functions directly. |
| `golden/scenarios/*.json` | Full checkouts: `{ scenario, expected }` recorded by running the legacy page flow (`legacy-harness/bin/run-scenario.php`). |

Everything under `golden/` is **generated** from the unmodified PHP (`npm run golden:generate`). Nothing
is hand-written. `npm run golden:verify` (and CI) regenerates it and requires a byte-for-byte match.

Numbers are stored the way PHP 7.4 prints them, `(string)(float)$value` (14 significant digits),
because that is the precision the legacy code shows its results in. The `exact` block of each scenario
keeps full-precision copies (`json_encode`) of values that staged checks feed back in as inputs.

## Differences from the upstream sample data (`legacy-baseline/catalog/install/oscommerce.sql`)

The upstream sample store has one tax rate (Florida 7%) and two currencies at rate 1.0. That is not
enough to exercise the pricing rules, so the demo catalog adds:

- **Tax:** Quebec GST 5% plus QST 9.975% at priority 2 (compounding), Ontario HST 13% (the ≥ 10% divisor
  branch), Germany 19% and 7% (two classes), New York 4% plus 4.5% at the same priority (summed), Florida
  2.5% reduced rate, and a "Shipping" tax class (3).
- **Currencies:** EUR at 0.8870 with `,` as the decimal point, and JPY with 0 decimal places.
- **Products:** 29 "Half-Cent Widget" 10.0050, 30 "Precision Gizmo" 19.9950 (rounding edges), and
  31 "Gift Wrap" with tax class 0. DVDs 4–7 and 16 use the reduced-rate class 2.
- **Specials:** an inactive special (status 0) on product 1, and an expired-but-active special on product 7.
- **Attributes:** Color Red +2.4950 and Black −1.3333 on product 25 (four-decimal prices).

Only products, prices and rates that the pricing slice uses are included. Descriptions and images are omitted.
