// Locate a PHP 7.4 interpreter and run legacy-harness scripts with it.
//
// Order of preference:
//   1. $PHP_BIN (e.g. CI sets it to the setup-php binary)
//   2. `php` on PATH, if it is PHP 7.4
//   3. the bundled WebAssembly build (@php-wasm/cli, PHP=7.4). No install needed.
//
// The WebAssembly build only sees files under the current working directory,
// so every path handed to PHP must be relative to the repo root.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let cached;

export function resolvePhp() {
  if (cached) return cached;
  const candidates = [];
  if (process.env.PHP_BIN) candidates.push({ cmd: process.env.PHP_BIN, args: [], env: {} });
  candidates.push({ cmd: 'php', args: [], env: {} });
  const wasm = path.join(REPO_ROOT, 'node_modules/.bin/php-wasm-cli');
  if (existsSync(wasm)) candidates.push({ cmd: wasm, args: [], env: { PHP: '7.4' } });

  for (const c of candidates) {
    const r = spawnSync(c.cmd, [...c.args, '-r', 'echo PHP_VERSION;'], {
      cwd: REPO_ROOT, env: { ...process.env, ...c.env }, encoding: 'utf8',
    });
    if (r.status === 0 && /^7\.4\./.test(r.stdout.trim())) {
      cached = { ...c, version: r.stdout.trim() };
      return cached;
    }
  }
  throw new Error('No PHP 7.4 found. Run `npm install` (bundles @php-wasm/cli) or set PHP_BIN.');
}

/** Run a harness script and return its parsed `result`, throwing on harness errors. */
export function runPhp(script, args = []) {
  const php = resolvePhp();
  const rel = (p) => (path.isAbsolute(p) ? path.relative(REPO_ROOT, p) : p);
  const stdout = execFileSync(php.cmd, [...php.args, rel(script), ...args.map(rel)], {
    cwd: REPO_ROOT, env: { ...process.env, ...php.env }, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  });
  let payload;
  try {
    payload = JSON.parse(stdout);
  } catch {
    throw new Error(`PHP produced non-JSON output for ${script} ${args.join(' ')}:\n${stdout.slice(0, 2000)}`);
  }
  if (!payload.ok) {
    throw new Error(`Legacy harness failed for ${script} ${args.join(' ')}: ${payload.error}\nQueries:\n${(payload.queries || []).join('\n')}`);
  }
  return payload.result;
}
