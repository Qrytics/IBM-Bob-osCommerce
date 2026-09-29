#!/usr/bin/env node
// Run the PHPUnit suites against the unmodified legacy code (LOCKED).
//
//   npm run legacy:test               # golden + Bob's tests, both DISPLAY_PRICE_WITH_TAX modes
//   npm run legacy:test -- --suite bob
//
// Uses the same PHP 7.4 as the fixture generator (bundled WebAssembly build, or $PHP_BIN).
// PHPUnit 9 is downloaded once into legacy-harness/tools/ (git-ignored).

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { REPO_ROOT, resolvePhp } from './golden/php.mjs';

const PHPUNIT_VERSION = '9.6.34';
const PHAR = path.join(REPO_ROOT, 'legacy-harness/tools', `phpunit-${PHPUNIT_VERSION}.phar`);

async function ensurePhpunit() {
  if (existsSync(PHAR)) return;
  mkdirSync(path.dirname(PHAR), { recursive: true });
  const url = `https://phar.phpunit.de/phpunit-${PHPUNIT_VERSION}.phar`;
  console.log(`Downloading PHPUnit ${PHPUNIT_VERSION} …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download ${url}: HTTP ${res.status}`);
  writeFileSync(PHAR, Buffer.from(await res.arrayBuffer()));
}

const i = process.argv.indexOf('--suite');
const suite = i === -1 ? null : process.argv[i + 1];

await ensurePhpunit();
const php = resolvePhp();
let failed = false;
for (const mode of ['false', 'true']) {
  console.log(`\n=== PHPUnit, DISPLAY_PRICE_WITH_TAX=${mode} (PHP ${php.version}) ===`);
  const args = [...php.args, path.relative(REPO_ROOT, PHAR), '-c', 'legacy-harness/phpunit.xml', '--colors=never'];
  if (suite) args.push('--testsuite', suite);
  const r = spawnSync(php.cmd, args, {
    cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8',
    env: { ...process.env, ...php.env, LEGACY_DISPLAY_PRICE_WITH_TAX: mode },
  });
  process.stdout.write(r.stdout || '');
  // The WebAssembly PHP does not propagate exit codes, so read PHPUnit's verdict.
  // Skipped tests are fine (requireMode); incomplete, risky or warning tests are not.
  const out = r.stdout || '';
  const bad = /FAILURES!|ERRORS!|WARNINGS!|Incomplete: \d|Risky: \d|Warnings: \d|No tests executed/.test(out);
  const count = Number((out.match(/OK \((\d+) tests?/) || out.match(/Tests: (\d+)/) || [])[1] || 0);
  const minimum = suite === 'golden' ? 5 : 15; // 5 golden tests + at least 10 of Bob's
  if (r.status !== 0 || !/\nOK/.test(out) || bad) failed = true;
  if (count < minimum) {
    console.error(`Expected at least ${minimum} tests, found ${count}. Bob's test methods must not be removed.`);
    failed = true;
  }
}
if (failed) {
  console.error('\n✘ Legacy PHPUnit suite failed (see above).');
  process.exit(1);
}
console.log('\n✔ Legacy PHPUnit suite passed in both modes.');
