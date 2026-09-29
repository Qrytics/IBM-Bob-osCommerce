#!/usr/bin/env node
// Anti-overfitting check (LOCKED): generate a FRESH random set of cases and scenarios
// from the legacy PHP with a new seed, then run every equivalence check against it.
// Code that only memorised the committed fixtures fails here.
//
//   npm run holdout                 # random seed
//   npm run holdout -- --seed 42    # reproducible

import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './php.mjs';

const i = process.argv.indexOf('--seed');
const seed = i === -1 ? Math.floor(Math.random() * 2 ** 31) : Number(process.argv[i + 1]);
const OUT = '.holdout';

rmSync(path.join(REPO_ROOT, OUT), { recursive: true, force: true });
const gen = spawnSync(process.execPath, [
  path.join(REPO_ROOT, 'scripts/golden/generate.mjs'), '--seed', String(seed), '--out', OUT, '--random-scenarios', '40', '--no-curated',
], { cwd: REPO_ROOT, stdio: 'inherit' });
if (gen.status !== 0) process.exit(gen.status || 1);

console.log(`\nRunning the equivalence checks on hold-out seed ${seed} …`);
const status = spawnSync(process.execPath, [path.join(REPO_ROOT, 'api/scripts/status.js'), '--strict'], {
  cwd: REPO_ROOT, stdio: 'inherit', env: { ...process.env, HOLDOUT_DIR: path.join(REPO_ROOT, OUT) },
});
if (status.status !== 0) {
  console.error(`✘ Hold-out seed ${seed} failed. Reproduce with: npm run holdout -- --seed ${seed}`);
  process.exit(1);
}
console.log(`✔ Hold-out seed ${seed}: every freshly generated legacy case reproduced.`);
