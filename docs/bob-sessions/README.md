# IBM Bob sessions

The conversations in which IBM Bob did the AI part of the modernization: the tasks in
[`BOB_TASKS.md`](../../BOB_TASKS.md), each in the project mode it names. Every file starts with the
prompt, the acceptance command and its result, and a short summary, followed by the full exported transcript.

| Session | Task | Mode | Result |
|---|---|---|---|
| [01-analysis](01-analysis.md) | T1 Analyze and document the legacy code | 📖 Analyst | 28 business rules, 10 quirks and the legacy architecture documented |
| [02-legacy-tests](02-legacy-tests.md) | T2 Baseline tests for the legacy math | 🧪 Legacy Tester | PHPUnit on the real PHP passes in both tax-display modes |
| [03-09-translation](03-09-translation.md) | T3–T9 Translate the business logic | 🔁 Translator | 14 files translated; all 2,296 legacy cases reproduced exactly |
| [10-architecture-modern](10-architecture-modern.md) | T10 Document the modern architecture | 📖 Analyst | Layer diagram, legacy-to-modern mapping, equivalence proof |
| [11-unit-tests](11-unit-tests.md) | T11 Unit tests for the new API | ✅ Unit Tester | 170 tests covering BR-01..BR-28; 100% coverage of the translated files |

T3–T9 ran as one continuous conversation, so they share one file instead of the seven files
(`03-general.md` … `09-order-totals.md`) that `BOB_TASKS.md` suggests.

[`TEMPLATE.md`](TEMPLATE.md) is the blank template the session files follow.
