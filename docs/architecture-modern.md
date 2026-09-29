# Modern architecture: CleanCart API

<!-- TEMPLATE — filled in by Bob (T10). Replace every TODO(bob) marker. Keep all headings, ids,
     "Legacy" and "Golden evidence" lines. Check with: npm run check:docs -- --stage modern -->

How the same rules are structured after the modernization.

## Overview

TODO(bob): what the service does, what it deliberately does not do (no sessions, no database writes, no HTML), and how it is deployed.

## Layers

TODO(bob): a Mermaid diagram of the layers (HTTP routes and validation, then the pure domain modules, then data access), and a sentence on each layer's responsibility.

## Legacy to modern mapping

TODO(bob): a table with columns Legacy function / page | Modern module and function | Business rules, covering every function in `general.js`, `tax.js`, `currency.js`, `cart.js`, `order.js`, `shipping/` and `orderTotals/`.

## How equivalence is proven

TODO(bob): explain the golden fixtures (recorded from the unmodified PHP in `legacy-harness/`), `phpNumber.js`, the staged checks, the random hold-out set and the live `/api/v1/equivalence` report.

## Extending the API

TODO(bob): how to add a new rule or fix a quirk safely (for example a "corrected" mode behind a flag), and what tests to add.
