'use strict';

/**
 * LOCKED. The definition of "done" for every translated module.
 *
 * Each describe block is one check from src/verify/checks.js, tagged with its
 * module so a single module can be run on its own:
 *
 *   npm run check:tax      (jest -t "\[tax\]")
 *
 * Every case compares the modern result with what the real osCommerce v2.3.4
 * PHP code produced (fixtures/golden). With HOLDOUT_DIR set, the same checks
 * also run against a freshly generated random hold-out set (npm run holdout).
 */

const path = require('node:path');
const { buildChecks, DEFAULT_GOLDEN_DIR } = require('../../src/verify/checks');
const { NotImplemented } = require('../../src/domain/errors');

const sources = [{ name: 'golden', dir: DEFAULT_GOLDEN_DIR }];
if (process.env.HOLDOUT_DIR) sources.push({ name: 'holdout', dir: path.resolve(process.env.HOLDOUT_DIR) });

for (const source of sources) {
  for (const check of buildChecks(source.dir)) {
    describe(`[${check.module}] ${check.id} (${source.name}): ${check.title}`, () => {
      // Probe once: an untranslated module yields ONE clear failure, not hundreds.
      let missing = null;
      try {
        if (check.cases.length) check.run(check.cases[0]);
      } catch (err) {
        if (err instanceof NotImplemented) missing = err;
      }

      if (missing) {
        test(`NOT IMPLEMENTED YET: ${missing.message}`, () => {
          throw missing;
        });
        return;
      }

      test.each(check.cases.map((c) => [check.label(c), c]))('%s', (label, c) => {
        const problems = check.run(c);
        if (problems.length) {
          throw new Error(`Modern result differs from legacy PHP for ${label}:\n  ${problems.join('\n  ')}`);
        }
      });
    });
  }
}
