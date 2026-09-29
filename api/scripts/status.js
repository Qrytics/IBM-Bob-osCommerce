#!/usr/bin/env node
'use strict';

/**
 * `npm run status`: translation progress, module by module (PROVIDED, LOCKED).
 * Prints the same numbers as GET /api/v1/equivalence and points at the next task.
 */

const path = require('node:path');
const { runAll, MODULES, DEFAULT_GOLDEN_DIR } = require('../src/verify/checks');

const dir = process.env.HOLDOUT_DIR ? path.resolve(process.env.HOLDOUT_DIR) : DEFAULT_GOLDEN_DIR;
const checks = runAll({ goldenDir: dir, maxFailures: 2 });
const color = process.stdout.isTTY ? (c, s) => `\x1b[${c}m${s}\x1b[0m` : (c, s) => s;
const ok = (s) => color(32, s);
const bad = (s) => color(31, s);
const dim = (s) => color(2, s);

console.log(`\nCleanCart translation status  ${dim(`(fixtures: ${path.relative(process.cwd(), dir) || dir})`)}\n`);
let next = null;
for (const m of MODULES) {
  const mine = checks.filter((c) => c.module === m.module);
  const passed = mine.reduce((n, c) => n + c.passed, 0);
  const total = mine.reduce((n, c) => n + c.total, 0);
  const done = passed === total;
  const missing = mine.find((c) => c.notImplemented);
  if (!done && !next) next = m;
  const mark = done ? ok('✔') : bad('✘');
  const detail = missing ? dim(missing.notImplemented) : done ? '' : bad(`${total - passed} case(s) differ from legacy PHP`);
  console.log(` ${mark} ${m.task.padEnd(6)} ${m.module.padEnd(9)} ${String(passed).padStart(5)}/${String(total).padEnd(5)} ${detail}`);
  if (!done && !missing) {
    for (const c of mine.filter((x) => x.failures.length)) {
      for (const f of c.failures) console.log(dim(`        ${c.id}: ${f.label}\n          ${f.problems.slice(0, 2).join('\n          ')}`));
    }
  }
}
const cases = checks.reduce((n, c) => n + c.total, 0);
const passed = checks.reduce((n, c) => n + c.passed, 0);
console.log(`\n ${passed === cases ? ok('ALL EQUIVALENT') : `${passed}/${cases} legacy cases reproduced`}`);
if (next) console.log(` Next: ${next.task} (${next.module}): see BOB_TASKS.md, then run \`npm run check:${next.module}\`\n`);
// Informational by default; --strict (used by npm run holdout) fails unless everything matches.
if (process.argv.includes('--strict') && passed !== cases) process.exitCode = 1;
