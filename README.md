## Liman – FCC License Dashboard

### What this is

- **Liman** is a one-screen dashboard for FCC experimental licenses:
  - Top half: a table of licenses.
  - Bottom half: a US map with station locations.
- It currently loads data from a CSV file and runs entirely in your browser against a tiny local HTTP server.

![screenshot](https://github.com/pnthomas/liman/blob/main/screenshot.png) 

### Files

- `index.html` – main dashboard (table + map) with company dropdown.
- `styles.css` – layout and styling.
- `app.js` – CSV loading, parsing, rendering, company selector, and table↔map interaction.
- `companies.json` – list of company (folder) names shown in the top-left dropdown; edit to add or remove companies.
- `licenses.sample.csv` – **public demo data** with synthetic/example licenses (used when company is `"demo"`).
- `licenses.csv` – **real data** at project root, used locally only and **ignored by git** (legacy single-CSV mode).
- `grantpdfs/{company}/` – per-company folders (e.g. `grantpdfs/licensee1/`, `grantpdfs/licensee2/`); each contains `licenses.csv` and optionally PDFs. Ignored by git.
- `PLAN.md` – project plan and phase breakdown.

### Running the dashboard locally

1. Open a terminal and start a simple HTTP server in the project folder:

   ```bash
   cd /Users/pthomas/src/liman
   python3 -m http.server 8000
   ```

2. In your browser, go to:

   ```text
   http://localhost:8000/index.html
   ```

3. Use the **Company** dropdown at the top-left to select which company's licenses to view. The app loads data from `grantpdfs/{company}/licenses.csv` for that company. Selection is remembered in the browser (localStorage).

### Multi-company and sample data

- **companies.json** lists the company names (folder names) shown in the dropdown, e.g. `["demo", "licensee1", "licensee2"]`. Add or remove names to match your `grantpdfs/` subfolders.
- Each company has its own folder under `grantpdfs/` with a `licenses.csv` inside it, e.g. `grantpdfs/licensee1/licenses.csv`, `grantpdfs/licensee2/licenses.csv`.
- The special company **demo** uses the built-in `licenses.sample.csv` at the project root (no need to create `grantpdfs/demo/`). Include `"demo"` in the list and select it in the dropdown to view sample data after cloning.
- The sample file is safe for public repos; `grantpdfs/` and root `licenses.csv` are **not** tracked by git.

### Phases (high level)

- **Phase 1 – Core dashboard MVP**
  - Dashboard runs from `licenses.csv` (or `licenses.sample.csv`) with:
    - Table + map.
    - Spectrum visual from 300 MHz to 5 GHz.
    - Table↔map highlighting.
- **Phase 2 – UX, launch flow, and visualization enhancements**
  - Row expansion, better map grouping, responsive layout, convenient launch (single command/double-click), clickable column-header sorting, **multi-company dropdown**, etc.
- **Phase 3 – Data automation (Modules A & B)**
  - Python tooling to:
    - Query the FCC Experimental Licensing System (ELS) search page.
    - Download new grant PDFs.
    - Extract structured data from PDFs via an LLM using a high-fidelity extraction prompt.
    - Update `licenses.csv` automatically.
