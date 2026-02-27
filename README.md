## Liman – FCC License Dashboard

### What this is

- **Liman** is a one-screen dashboard for FCC experimental licenses:
  - Top half: a table of licenses.
  - Bottom half: a US map with station locations.
- It currently loads data from a CSV file and runs entirely in your browser against a tiny local HTTP server.

### Files

- `index.html` – main dashboard (table + map).
- `styles.css` – layout and styling.
- `app.js` – CSV loading, parsing, rendering, and table↔map interaction.
- `licenses.sample.csv` – **public demo data** with synthetic/example licenses.
- `licenses.csv` – **real data**, used locally only and **ignored by git**.
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

3. You should see the table and map populated from `licenses.csv` (if present) or you can use the sample data below.

### Using the sample data (public-friendly)

For people cloning the repo or when you don’t want to expose real license data:

1. Copy the sample CSV to `licenses.csv`:

   ```bash
   cd /Users/pthomas/src/liman
   cp licenses.sample.csv licenses.csv
   ```

2. Start the local server and open the dashboard as described above.

The sample file `licenses.sample.csv` contains only synthetic/example licenses and is safe to keep in a public repository. The real `licenses.csv` and any `grantpdfs/` are kept local and are **not** tracked by git.

### Phases (high level)

- **Phase 1 – Core dashboard MVP**
  - Dashboard runs from `licenses.csv` (or `licenses.sample.csv`) with:
    - Table + map.
    - Spectrum visual from 300 MHz to 5 GHz.
    - Table↔map highlighting.
- **Phase 2 – UX, launch flow, and visualization enhancements**
  - Row expansion, better map grouping, responsive layout, convenient launch (single command/double-click), clickable column-header sorting, etc.
- **Phase 3 – Data automation (Modules A & B)**
  - Python tooling to:
    - Query the FCC Experimental Licensing System (ELS) search page.
    - Download new grant PDFs.
    - Extract structured data from PDFs via an LLM using a high-fidelity extraction prompt.
    - Update `licenses.csv` automatically.

