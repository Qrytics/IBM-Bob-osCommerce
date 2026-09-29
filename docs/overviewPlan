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

"We used Bob to modernize the notoriously tangled osCommerce platform. Historically, osCommerce suffers from 'spaghetti code' where UI, database queries, and business logic are fused into single files. We isolated the critical, legacy checkout module and used Bob to extract the core pricing algorithms without breaking them. We then transformed this logic into a secure, decoupled, and fully test-covered Node.js REST API. By generating automated tests and modern architecture, we proved that legacy enterprises can modernize mission-critical systems securely and efficiently using AI."

* **Selected Track:** Modernize what matters  
* **Tech Stack Used:** Legacy PHP (Baseline), Node.js, Express.js, Jest (Testing), Swagger (API Documentation), Render (Deployment), IBM Bob (AI Coding Assistant).

## **2\. Improvements Made**

"We started with the legacy open-source osCommerce v2.3 codebase."

* **Decoupling:** We removed the tightly coupled HTML/UI code from the core shopping cart business logic.  
* **Language Migration:** We translated the outdated, unstructured PHP logic into a modern, modular Node.js API.  
* **Test Coverage:** The original code had zero automated tests. We used Bob to generate a 100% test-covered suite for the cart math to mathematically prove our modernization didn't disrupt core functionality.  
* **API Enablement:** The cart logic is now accessible via REST API, allowing it to be integrated with modern web or mobile frontends.

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

