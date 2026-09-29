#!/usr/bin/env node
// Writes the documentation templates Bob fills in (maintainers only; run once).
// Refuses to overwrite a document that has already been edited.

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, QUIRKS } from './rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');

function write(rel, text) {
  const file = path.join(ROOT, rel);
  if (existsSync(file) && !force && !readFileSync(file, 'utf8').includes('TEMPLATE — filled in by Bob')) {
    console.log(`skip ${rel} (already edited)`);
    return;
  }
  writeFileSync(file, text);
  console.log(`wrote ${rel}`);
}

const header = (title, task, intro) => `# ${title}

<!-- TEMPLATE — filled in by Bob (${task}). Replace every TODO(bob) marker. Keep all headings, ids,
     "Legacy" and "Golden evidence" lines. Check with: npm run check:docs -- --stage ${task === 'T10' ? 'modern' : 'analysis'} -->

${intro}
`;

write('docs/business-rules.md', `${header('Business rules of the osCommerce pricing slice', 'T1',
  'Every rule the modern API reproduces. Legacy paths are relative to `legacy-baseline/catalog/includes/`, modern paths to `api/src/domain/`, evidence paths to `fixtures/golden/`. Unit tests cite these ids in their names.')}
${RULES.map((r) => `## ${r.id} — ${r.title}

- **Legacy:** \`${r.legacy}\`
- **Modern:** \`${r.modern}\`
- **Golden evidence:** \`${r.evidence}\`
- **Rule:** TODO(bob): explain the rule in plain language, as a business analyst would, including any conditions and edge cases.
- **Worked example:** TODO(bob): one worked example with real numbers taken from the golden evidence file.
`).join('\n')}`);

write('docs/legacy-quirks.md', `${header('Legacy quirks preserved on purpose', 'T1',
  'Behaviour of osCommerce v2.3.4 that looks like a bug (and often is). The modern API reproduces each one exactly, because it must match the legacy output. Each entry says how a future "corrected" mode could behave.')}
${QUIRKS.map((q) => `## ${q.id} — ${q.title}

- **Legacy:** \`${q.legacy}\`
- **Golden evidence:** \`${q.evidence}\`
- **What happens:** TODO(bob): explain the mechanism (which line, which PHP conversion or comparison causes it).
- **Worked example:** TODO(bob): the legacy result vs. the mathematically expected result, with real numbers.
- **A future fix:** TODO(bob): how a corrected mode would behave and what it would change for merchants.
`).join('\n')}`);

write('docs/architecture-legacy.md', `${header('Legacy architecture: osCommerce v2.3.4 checkout', 'T1',
  'How the storefront computed cart and checkout totals before the modernization.')}
## Overview

TODO(bob): two or three paragraphs: what the pricing slice does, which pages and classes take part, and why it is hard to change.

## Request flow

TODO(bob): a Mermaid sequence or flow diagram from \`shopping_cart.php\` through \`checkout_shipping.php\` and \`checkout_confirmation.php\` to \`checkout_process.php\`, showing the classes (\`shoppingCart\`, \`order\`, \`shipping\`, \`order_total\`, \`currencies\`), the \`general.php\` functions and the database tables involved.

## Where HTML, SQL and business math are coupled

TODO(bob): a table with columns File | HTML output | SQL queries | Business math | Globals/session, with one row per file in the slice, then a short explanation with a code excerpt.

## Data the pricing slice reads

TODO(bob): the tables and configuration constants the math depends on (see \`legacy-harness/lib/FakeDb.php\` and \`legacy-harness/lib/bootstrap.php\` for the exact list).

## Risks of changing the legacy code

TODO(bob): what makes a rewrite risky (float/string conversions, globals, implicit ordering, …) and how the golden fixtures reduce that risk.
`);

write('docs/architecture-modern.md', `${header('Modern architecture: CleanCart API', 'T10',
  'How the same rules are structured after the modernization.')}
## Overview

TODO(bob): what the service does, what it deliberately does not do (no sessions, no database writes, no HTML), and how it is deployed.

## Layers

TODO(bob): a Mermaid diagram of the layers (HTTP routes and validation, then the pure domain modules, then data access), and a sentence on each layer's responsibility.

## Legacy to modern mapping

TODO(bob): a table with columns Legacy function / page | Modern module and function | Business rules, covering every function in \`general.js\`, \`tax.js\`, \`currency.js\`, \`cart.js\`, \`order.js\`, \`shipping/\` and \`orderTotals/\`.

## How equivalence is proven

TODO(bob): explain the golden fixtures (recorded from the unmodified PHP in \`legacy-harness/\`), \`phpNumber.js\`, the staged checks, the random hold-out set and the live \`/api/v1/equivalence\` report.

## Extending the API

TODO(bob): how to add a new rule or fix a quirk safely (for example a "corrected" mode behind a flag), and what tests to add.
`);
