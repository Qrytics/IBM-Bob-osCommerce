# CleanCart guardrails (all modes)

1. Do ONLY the current task in `BOB_TASKS.md`, in the mode it names. Do not start the next task unless asked.
2. The golden fixtures (`fixtures/golden/`) are the specification: outputs recorded from the unmodified
   osCommerce PHP. If your result differs, your code is wrong, never the fixture or the test.
3. Reproduce legacy behaviour exactly, including the quirks listed in `docs/legacy-quirks.md`. Never "fix" them.
4. Edit only the files your mode allows. Do not use the terminal to change any other file
   (no `sed`, `git checkout`, `git stash`, `npm install`, `npm run golden:generate`, `npm run protect:update`).
   `npm run check:protected` detects every change to a protected file.
5. Keep exported names and signatures exactly as in the stubs.
6. No hard-coded answers, no fixture reads from domain code, no skipped tests, no coverage or lint suppression.
7. After each change run the task's check command. A task is finished only when its acceptance command passes.
8. When stuck on a failing case, compare your intermediate values with the legacy code line by line.
   The usual cause is an implicit PHP conversion: use `phpToString` / `phpToNumber` from
   `api/src/domain/phpNumber.js`.
9. Explain what you changed and why, citing the legacy file and line and the BR-/Q-ids.
   This transcript is shown in the project's demo.
