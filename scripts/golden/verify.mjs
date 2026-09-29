#!/usr/bin/env node
// Re-run the legacy PHP and confirm the committed golden fixtures are exactly what it
// produces today (LOCKED). Nothing in fixtures/ is touched.
//
//   npm run golden:verify

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './php.mjs';

const OUT = path.join(REPO_ROOT, '.golden-verify');
const GOLDEN = path.join(REPO_ROOT, 'fixtures/golden');

rmSync(OUT, { recursive: true, force: true });
const r = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts/golden/generate.mjs'), '--out', '.golden-verify'], { cwd: REPO_ROOT, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status || 1);

const list = (dir) => readdirSync(dir).flatMap((f) => {
  const full = path.join(dir, f);
  return statSync(full).isDirectory() ? list(full).map((x) => path.join(f, x)) : [f];
}).sort();

const want = list(GOLDEN);
const got = list(OUT);
const problems = [];
for (const f of new Set([...want, ...got])) {
  if (!want.includes(f)) problems.push(`not committed: ${f}`);
  else if (!got.includes(f)) problems.push(`no longer produced: ${f}`);
  else if (readFileSync(path.join(GOLDEN, f), 'utf8') !== readFileSync(path.join(OUT, f), 'utf8')) problems.push(`differs: ${f}`);
}
rmSync(OUT, { recursive: true, force: true });

if (problems.length) {
  console.error(`✘ Golden fixtures do not match the legacy PHP output (${problems.length}):`);
  for (const p of problems.slice(0, 30)) console.error(`   ${p}`);
  process.exit(1);
}
console.log(`✔ All ${want.length} golden fixture files reproduce byte-for-byte from the legacy PHP.`);
