# **osCommerce Modernization Hackathon Action Plan**

# **Phase 1: Setup & The Baseline (Hours 1–4)**

**Goal:** Set up your development environment and isolate the legacy codebase section to modernize.

* **Initialize the GitHub Repo:**  
  * Create a new public repository (e.g., `osCommerce-Modernization-Bob`).  
  * Invite your team members.  
  * Set up an initial `README.md`.  
* **Acquire the Legacy Code:**  
  * Download a legacy version of osCommerce (e.g., v2.3) from GitHub or SourceForge.  
  * Commit this into a `/legacy-baseline` directory so judges can view the original "before" state.  
* **Target the Legacy Slice:**  
  * Focus on `shopping_cart.php` or `checkout_process.php` where HTML, SQL database queries, and pricing/tax business math are tightly coupled.

# **Phase 2: AI-Driven Execution (Hours 5–16)**

**Goal:** Leverage Bob to analyze, document, isolate, and modernize the core logic.

* **Analyze & Document:**  
  * Feed the legacy PHP script into Bob.  
  * Request Bob to explain the core business rules and generate architectural markdown documentation.  
* **Generate Baseline Tests:**  
  * Prompt Bob to write baseline unit tests for the original business math (tax, cart totals, discounts) prior to modifying any code.  
* **Refactoring & Extraction:**  
  * Have Bob decouple the business logic from HTML and database queries, translating it into a modern REST API (e.g., Node.js/Express or Python/FastAPI).  
* **Verify & Test:**  
  * Prompt Bob to generate unit tests (e.g., Jest or PyTest) for the new REST API to mathematically prove equivalence to legacy output.

# **Phase 3: Deployment (Hours 17–20)**

**Goal:** Deploy the solution to establish a live working environment URL.

* **Host the API:**  
  * Deploy the Node.js or Python API to a cloud host (Render, Vercel, or Heroku).  
* **Create a Visual Interface / Demo:**  
  * Generate Swagger/OpenAPI documentation or construct a lightweight frontend interface to allow interactive testing of the modernized API endpoints.

# **Phase 4: Submission Materials Drafts**

## **1\. Project Details (Max 100 words)**

"CleanCart modernizes the checkout math of osCommerce v2.3.4, a 20-year-old PHP shop where pricing, SQL and HTML share the same files. We first recorded the untouched PHP's outputs (2,296 cases) as golden fixtures, then used IBM Bob in four locked-down custom modes for 11 tasks: documenting 28 business rules and 10 quirks, pinning them with PHPUnit, translating the logic into 14 pure JavaScript modules, and writing 170 unit tests. The result is a stateless Node.js REST API on Render that reproduces the legacy results exactly, bugs included, proven by 3,118 tests, a random hold-out set and a live equivalence endpoint."

* **Team:** I-will-win (Mario, solo)  
* **Selected Track:** Modernize what matters  
* **Tech Stack Used:** IBM Bob (4 custom modes, 11 tasks), osCommerce v2.3.4 PHP run on PHP 7.4 via WebAssembly, PHPUnit 9, Node.js 24, Express 4, OpenAPI 3 + Swagger UI, Jest, ESLint, GitHub Actions, Render. Claude Code was used for the scaffolding and guardrails (see the README's "How this was built").

## **2\. Improvements Made**

"We started from the unmodified open-source osCommerce v2.3.4 codebase (kept in `legacy-baseline/`)."

* **Decoupling:** The checkout pricing logic now lives in pure functions with no HTML, SQL, session or global state.  
* **Language Migration:** Bob translated the PHP pricing logic (tax, currency, cart, order, shipping, order totals) into 14 modular Node.js modules.  
* **Test Coverage:** The osCommerce checkout had no automated tests. There are now PHPUnit characterization tests on the legacy PHP and 3,118 Jest tests, with 100% line and branch coverage of the translated modules.  
* **Proven equivalence:** Every result matches 2,296 outputs recorded from the untouched PHP, exactly and with its 10 documented quirks, plus a freshly generated random hold-out set on every CI run.  
* **API Enablement:** The cart and checkout math is available as a documented REST API (OpenAPI + Swagger UI), deployed on Render, for modern web or mobile frontends.

## **3\. Pitch Deck Outline (PDF Structure)**

| Slide | Topic | Content Summary |
| :---- | :---- | :---- |
| **Slide 1** | Title & Team | **Project:** CleanCart \- Modernizing osCommerce with Bob. Team introduction and roles. |
| **Slide 2** | The Problem (Legacy Systems) | Highlight risks of tightly coupled legacy software (showing a snippet of legacy osCommerce PHP code). |
| **Slide 3** | Project Summary & Architecture | High-level solution diagram detailing the 3-step workflow: *Analyze \-\> Extract \-\> Test & API Enablement*. |
| **Slide 4** | Technical Proof & Validation | Side-by-side comparison (Legacy PHP vs. Clean Node.js API with passing test suites). |
| **Slide 5** | Future Roadmap | Containerization via Docker, modernizing authentication, and database migration strategies. |

## **4\. Demo Video Script Outline (Max 3 minutes)**

| Timestamp | Segment | Description |
| :---- | :---- | :---- |
| **0:00 – 0:30** | Problem Overview | Introduce the legacy pain point. Show the tangled osCommerce PHP file. |
| **0:30 – 1:30** | AI Execution | Demonstrate interactions with Bob (code analysis, decoupling, and API translation). |
| **1:30 – 2:00** | Verification | Display automated test execution (green checkmarks proving core behavior retention). |
| **2:00 – 2:45** | Live Demonstration | Demonstrate the live working environment via Swagger UI / live frontend. |
| **2:45 – 3:00** | Conclusion | Conclude with the business value and impact of AI-assisted modernization. |

## **5\. GitHub Repository Requirements**

Ensure the repository contains:

* Comprehensive `README.md`  
* `/legacy-baseline` directory containing original PHP source code  
* Modernized Node.js API codebase  
* Test suite and clear, step-by-step testing commands (e.g., `npm install && npm test`)  
* Link to the live API/Swagger demo environment

