#!/usr/bin/env node
// Documentation gate (LOCKED).
//
//   node scripts/check-docs.mjs --stage analysis   # T1: business rules, quirks, legacy architecture
//   node scripts/check-docs.mjs --stage modern     # T10: modern architecture
//   node scripts/check-docs.mjs                    # everything, plus: every BR id is cited by a unit test (T11)
//
// It checks structure and completeness, not prose quality: every TODO(bob) marker is
// gone, headings / ids / evidence lines from the templates are intact, worked examples
// contain real numbers, and diagrams are present.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, QUIRKS } from './rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--stage');
const stage = i === -1 ? 'all' : process.argv[i + 1];
if (!['analysis', 'modern', 'all'].includes(stage)) {
  console.error('usage: check-docs.mjs [--stage analysis|modern]');
  process.exit(2);
}

const problems = [];
const read = (rel) => {
  const file = path.join(ROOT, rel);
  if (!existsSync(file)) {
    problems.push(`${rel}: file is missing`);
    return '';
  }
  return readFileSync(file, 'utf8');
};

/** Text of the section that starts with `heading` (up to the next heading of the same or higher level). */
function section(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(heading));
  if (start === -1) return null;
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    const m = lines[j].match(/^(#+)\s/);
    if (m && m[1].length <= level) { end = j; break; }
  }
  return lines.slice(start, end).join('\n');
}

function noTodos(rel, text) {
  const count = (text.match(/TODO\(bob\)/g) || []).length;
  if (count) problems.push(`${rel}: ${count} TODO(bob) marker(s) left to fill in`);
}

function needs(rel, text, snippet, what) {
  if (!text.includes(snippet)) problems.push(`${rel}: ${what || `missing "${snippet}"`}`);
}

function field(sec, name) {
  const m = sec.match(new RegExp(`\\*\\*${name}:\\*\\*([\\s\\S]*?)(?=\\n- \\*\\*|\\n#|$)`));
  return m ? m[1].trim() : '';
}

function checkBusinessRules() {
  const rel = 'docs/business-rules.md';
  const text = read(rel);
  if (!text) return;
  noTodos(rel, text);
  for (const r of RULES) {
    const sec = section(text, `## ${r.id} `);
    if (!sec) { problems.push(`${rel}: missing section "## ${r.id} — ${r.title}"`); continue; }
    needs(rel, sec, r.legacy, `${r.id}: the Legacy line must still cite ${r.legacy}`);
    needs(rel, sec, r.evidence, `${r.id}: the Golden evidence line must still cite ${r.evidence}`);
    const rule = field(sec, 'Rule');
    const example = field(sec, 'Worked example');
    if (rule.length < 60) problems.push(`${rel}: ${r.id} "Rule" needs a real explanation (at least a couple of sentences)`);
    if (!/\d/.test(example)) problems.push(`${rel}: ${r.id} "Worked example" must contain concrete numbers from the golden evidence`);
  }
}

function checkQuirks() {
  const rel = 'docs/legacy-quirks.md';
  const text = read(rel);
  if (!text) return;
  noTodos(rel, text);
  for (const q of QUIRKS) {
    const sec = section(text, `## ${q.id} `);
    if (!sec) { problems.push(`${rel}: missing section "## ${q.id} — ${q.title}"`); continue; }
    needs(rel, sec, q.legacy, `${q.id}: the Legacy line must still cite ${q.legacy}`);
    const what = field(sec, 'What happens');
    const example = field(sec, 'Worked example');
    const fix = field(sec, 'A future fix');
    if (what.length < 60) problems.push(`${rel}: ${q.id} "What happens" needs a real explanation`);
    if (!/\d/.test(example)) problems.push(`${rel}: ${q.id} "Worked example" must contain concrete numbers`);
    if (fix.length < 30) problems.push(`${rel}: ${q.id} "A future fix" must describe how a corrected mode would behave`);
  }
}

function checkArchitecture(rel, requiredHeadings, mustMention = []) {
  const text = read(rel);
  if (!text) return;
  noTodos(rel, text);
  for (const h of requiredHeadings) if (!section(text, h)) problems.push(`${rel}: missing section "${h}"`);
  if (!/```mermaid\n[\s\S]{40,}?```/.test(text)) problems.push(`${rel}: needs at least one Mermaid diagram (\`\`\`mermaid block)`);
  for (const m of mustMention) needs(rel, text, m, `must mention ${m}`);
}

function checkUnitTestCitations() {
  const dir = path.join(ROOT, 'api/test/unit');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.test.js')) : [];
  const text = files.map((f) => readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const missing = RULES.filter((r) => !new RegExp(`\\b${r.id}\\b`).test(text)).map((r) => r.id);
  if (missing.length) problems.push(`api/test/unit: no unit test names these business rules yet: ${missing.join(', ')}`);
}

if (stage === 'analysis' || stage === 'all') {
  checkBusinessRules();
  checkQuirks();
  checkArchitecture('docs/architecture-legacy.md',
    ['## Overview', '## Request flow', '## Where HTML, SQL and business math are coupled', '## Data the pricing slice reads', '## Risks of changing the legacy code'],
    ['shopping_cart.php', 'checkout_process.php', 'order.php', 'currencies.php', 'general.php']);
}
if (stage === 'modern' || stage === 'all') {
  checkArchitecture('docs/architecture-modern.md',
    ['## Overview', '## Layers', '## Legacy to modern mapping', '## How equivalence is proven', '## Extending the API'],
    ['general.js', 'tax.js', 'currency.js', 'cart.js', 'order.js', 'shipping/', 'orderTotals/', 'phpNumber.js', 'fixtures/golden']);
}
if (stage === 'all') checkUnitTestCitations();

if (problems.length) {
  console.error(`✘ Documentation incomplete (${problems.length} problem(s), stage "${stage}"):`);
  for (const p of problems.slice(0, 60)) console.error(`   - ${p}`);
  if (problems.length > 60) console.error(`   … and ${problems.length - 60} more`);
  process.exit(1);
}
console.log(`✔ Documentation complete (stage "${stage}").`);
