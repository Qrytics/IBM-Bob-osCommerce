#!/usr/bin/env node
// Anti-shortcut checks on the files Bob writes (LOCKED).
//
// Fails when a Bob-owned file:
//   - switches off coverage (istanbul/c8 ignore comments),
//   - skips or focuses tests (test.skip, it.only, xit, describe.skip, ...),
//   - disables lint rules (anything but `eslint-disable-next-line no-unused-vars`),
//   - reads the golden fixtures, or
//   - in PHPUnit tests, marks tests incomplete or skipped (other than LegacyTestCase::requireMode).

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((f) => {
  const full = path.join(dir, f);
  return statSync(full).isDirectory() ? walk(full) : [full];
}) : []);

const domain = walk(path.join(ROOT, 'api/src/domain')).filter((f) => !/(phpNumber|types|constants|errors)\.js$|domain\/index\.js$/.test(f));
const unitTests = walk(path.join(ROOT, 'api/test/unit')).filter((f) => f.endsWith('.js'));
const phpTests = walk(path.join(ROOT, 'legacy-harness/tests/bob')).filter((f) => f.endsWith('.php'));

const rules = [
  { files: [...domain, ...unitTests], re: /(istanbul|c8|v8)\s+ignore/, msg: 'coverage-ignore comment' },
  {
    files: [...domain, ...unitTests],
    re: { test: (line) => /eslint-disable/.test(line) && !/eslint-disable-next-line no-unused-vars\s*$/.test(line) },
    msg: 'eslint-disable (only "eslint-disable-next-line no-unused-vars" is allowed)',
  },
  { files: domain, code: true, re: /fixtures|golden|readFileSync|require\(['"][^'"]+\.json['"]\)/, msg: 'domain code must not read fixtures' },
  { files: unitTests, re: /\b(test|it|describe)\.(skip|only|todo)\b|\bx(it|test|describe)\s*\(|\bf(it|describe)\s*\(/, msg: 'skipped or focused test' },
  { files: phpTests, re: /markTestIncomplete|markTestSkipped/, msg: 'incomplete or skipped PHPUnit test (use requireMode() for mode-specific tests)' },
];

const problems = [];
const isComment = (line) => /^\s*(\/\/|\/?\*)/.test(line);
for (const { files, re, msg, code } of rules) {
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, n) => {
      if (code && isComment(line)) return;
      if (re.test(line)) problems.push(`${path.relative(ROOT, f)}:${n + 1}: ${msg}`);
    });
  }
}

if (problems.length) {
  console.error(`✘ Integrity check failed (${problems.length}):`);
  for (const p of problems.slice(0, 40)) console.error(`   ${p}`);
  process.exit(1);
}
console.log(`✔ Integrity check passed (${domain.length} domain files, ${unitTests.length} unit test files, ${phpTests.length} legacy test files).`);
