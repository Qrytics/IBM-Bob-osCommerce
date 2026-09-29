#!/usr/bin/env node
// Integrity manifest for everything Bob must NOT change (LOCKED).
//
//   node scripts/protect.mjs check    # fail if a protected file was changed, removed or added
//   node scripts/protect.mjs update   # maintainers only: re-record the manifest after intended edits
//
// "Protected" means every file in the repo EXCEPT the paths Bob's modes may edit.
// Those paths are read from the fileRegex entries in .bob/custom_modes.yaml, so the
// editor restrictions and this check can never drift apart.
//
// scripts/protected.sha256 uses the `shasum -a 256` format, so CI also verifies it
// without this script: shasum -a 256 -c scripts/protected.sha256

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'scripts/protected.sha256';
const require = createRequire(path.join(ROOT, 'api/package.json'));
const YAML = require('yaml');

function bobWritable() {
  const modes = YAML.parse(readFileSync(path.join(ROOT, '.bob/custom_modes.yaml'), 'utf8')).customModes;
  const regexes = [];
  for (const mode of modes) {
    for (const group of mode.groups || []) {
      if (Array.isArray(group) && group[0] === 'edit' && group[1] && group[1].fileRegex) regexes.push(new RegExp(group[1].fileRegex));
    }
  }
  if (regexes.length === 0) throw new Error('No fileRegex found in .bob/custom_modes.yaml');
  return regexes;
}

function repoFiles() {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT });
  return out.toString('utf8').split('\0').filter(Boolean).filter((f) => existsSync(path.join(ROOT, f))).sort();
}

function protectedFiles() {
  const writable = bobWritable();
  return repoFiles().filter((f) => f !== MANIFEST && !writable.some((r) => r.test(f)));
}

const sha = (f) => createHash('sha256').update(readFileSync(path.join(ROOT, f))).digest('hex');

function readManifest() {
  const lines = readFileSync(path.join(ROOT, MANIFEST), 'utf8').split('\n').filter(Boolean);
  return new Map(lines.map((l) => [l.slice(66), l.slice(0, 64)]));
}

const cmd = process.argv[2];
if (cmd === 'update') {
  const files = protectedFiles();
  writeFileSync(path.join(ROOT, MANIFEST), files.map((f) => `${sha(f)}  ${f}`).join('\n') + '\n');
  console.log(`Recorded ${files.length} protected files in ${MANIFEST}.`);
} else if (cmd === 'check') {
  const recorded = readManifest();
  const problems = [];
  for (const [f, hash] of recorded) {
    if (!existsSync(path.join(ROOT, f))) problems.push(`removed:  ${f}`);
    else if (sha(f) !== hash) problems.push(`modified: ${f}`);
  }
  for (const f of protectedFiles()) if (!recorded.has(f)) problems.push(`added:    ${f}`);
  if (problems.length) {
    console.error(`✘ Protected files changed (${problems.length}). Bob may only edit the files its mode allows (see AGENTS.md):`);
    for (const p of problems.slice(0, 40)) console.error(`   ${p}`);
    console.error('\n  Revert these changes: git checkout -- <file>  (or delete added files).');
    console.error('  Maintainers who changed them on purpose: npm run protect:update');
    process.exit(1);
  }
  console.log(`✔ ${recorded.size} protected files unchanged.`);
} else {
  console.error('usage: protect.mjs check|update');
  process.exit(2);
}
