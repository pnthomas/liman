## Liman FCC License Dashboard – Project Plan

### Overview

- **Goal**: A one-screen local dashboard that shows FCC experimental licenses (table + US map) for a given FRN, plus a Python pipeline to refresh data from the FCC site and extract license details via an LLM.
- **Current status**: Phase 1 front-end is working from `licenses.csv` – the table and map display all 5 current licenses with a 300 MHz–5 GHz spectrum visual.
- **Tech stack**: HTML/CSS/JS + Leaflet on the front-end; Python 3 for FCC scraping, PDF handling, and LLM extraction.

### Files and structure

- `index.html` – main dashboard (table on top, map on bottom).
- `styles.css` – layout and styling for the table, spectrum visual, and map.
- `app.js` – loads `licenses.csv`, parses it, renders the table and map, and keeps them in sync.
- `licenses.csv` – canonical license dataset (currently manually maintained).
- `mockup.html` – original static mockup (kept for reference).
- (Planned) `scripts/scan_extract.py` – Python CLI for scanning FCC, downloading PDFs, and extracting structured data via LLM.
- (Planned) `grantpdfs/` – downloaded grant PDFs named `<CALLSIGN>.pdf`.
- (Planned) `.env` – LLM API key and config (ignored by git).
- (Planned) `requirements.txt`, `README.md` – environment, setup, and usage docs.

### Data model (logical fields)

Logical field names used in code (actual CSV headers are FCC-style; `app.js` normalizes them):

- `callsign`
- `authorization_effective_date`
- `authorization_expiry_date`
- `emission_designators`
- `authorized_power`
- `station_location`
- `station_coordinates` – strings like `"(1) NL 21-29-28; WL 158-06-18; (2) NL …"`.
- `frequency` – comma-separated ranges like `"480-490 MHz, 1710-1720 MHz"`.
- `notes`

`app.js`:

- Normalizes CSV headers into the logical names above.
- Parses `station_coordinates` DMS-style text into decimal lat/long.
- Parses `frequency` values into numeric ranges for:
  - A **numeric frequency** column.
  - A **spectrum visual** with a 300 MHz–5 GHz track and blue bars for authorized ranges.

### Modules and phases

#### Phase 1 – Core dashboard MVP

**Done**

- **Front-end structure**
  - Refactored `mockup.html` into `index.html`, `styles.css`, and `app.js`, preserving the look and behavior.
  - Uses Leaflet for a US map, with markers linked to table rows.
- **CSV-driven data**
  - `app.js` now loads `licenses.csv` via `fetch()`, parses it, and renders:
    - Table rows sorted alphabetically by callsign.
    - Markers per station coordinate.
  - Robust CSV parsing handles quoted fields with commas.
  - Coordinates in DMS format are converted to decimal degrees.
- **Spectrum visual**
  - Frequency track spans **300 MHz–5 GHz**.
  - Multiple ranges per license are supported (multiple blue bars).
  - Labels show `300M`, `2.6G`, `5G`.

**Next (Phase 1 still to do)**

- **Docs and environment**
  - Add `requirements.txt` with Python dependencies.
  - Add `README.md` covering:
    - How to set up a virtualenv.
    - How to configure `.env` with the LLM API key.
    - How to run `python3 -m http.server` and `scan_extract.py`.

#### Phase 2 – UX, launch flow, and visualization enhancements

- **Row expansion**
  - Add a richer per-location data structure (e.g., `locations_json` field or sidecar JSON).
  - Clicking a license row expands details:
    - Each station’s emission designators, power, numeric ranges, and its own spectrum bar.
- **Map enhancements**
  - Group markers for overlapping or identical coordinates.
  - Show richer tooltips (e.g., list callsigns at that point).
  - Implement **pie-chart markers**:
    - Blue/gray pie inside each marker shows remaining license duration:
      - `fraction_remaining = clamp((expiry - today) / (expiry - effective), 0, 1)`.
    - Start at 12 o’clock, progress clockwise.
    - For grouped locations, use max or average fraction (TBD).
- **Polish**
  - Add error handling if `licenses.csv` is missing or invalid.
  - Consider light filters (by callsign, geography, or frequency band) while keeping a single-screen layout.
  - Gracefully handle screen resizing (responsive layout while preserving the single-screen design).
- **Spectrum visual refinements**
  - In the 300 MHz–5 GHz spectrum track, add thin, darker-blue edge bands at the start and end of each licensed range to emphasize band boundaries.
- **Map labels**
  - Add small, unobtrusive callsign labels near each map dot:
    - Either as light gray text always shown, or as labels that appear on hover, to avoid clutter while still making the map legible at a glance.
- **Sorting**
  - Keep default sort by callsign on initial load.
  - Add clickable column headers so clicking a heading re-sorts the table by that column (toggling ascending/descending), while keeping map highlighting behavior in sync.
- **Launch flow**
  - Consider how to launch the dashboard more conveniently from the OS GUI or command line (e.g., a single command or double-click that starts the local server and opens the browser).
- **Multi-company selector**
  - Dropdown at top-left to switch between license folders (e.g. `grantpdfs/licensee1`, `grantpdfs/licensee2`).
  - Company list from `companies.json` (array of folder names); each company’s CSV at `grantpdfs/{company}/licenses.csv`.
  - Persist selected company in `localStorage`; on first load use first company in list if no saved value.

#### Phase 3 – Data automation (Modules A & B)

- **Module A – Scan FCC**
  - Some FCC databases are available via API, but ELS is not yet one of them. The official and only available way to query ELS is via the search page at `https://apps.fcc.gov/oetcf/els/reports/GenericSearch.cfm`.
  - Create `scripts/scan_extract.py` with a `refresh` command that:
    - Submits a search for FRN `0037710076` to the FCC ELS Generic Search page.
    - Parses the HTML to find callsigns and “view grant” links.
    - Downloads new grant PDFs to `grantpdfs/<CALLSIGN>.pdf` for any callsigns not yet in `licenses.csv`.
- **Module B – Extract and update CSV**
  - Because the only canonical source for experimental licensing grant parameters is the PDFs obtained through ELS, we need a way to reliably parse those PDFs automatically and without hallucinations.
  - Extend `scan_extract.py` to:
    - Extract text from each new PDF (e.g., via `pdfplumber`).
    - Call the LLM API with the High-Fidelity Extraction Prompt.
    - Validate and normalize the JSON response into the logical fields above.
    - Append new licenses into `licenses.csv`, keeping it sorted by callsign.

### Git and workflow notes

- Use small, focused commits:
  - Front-end structure changes.
  - CSV/coordinate/frequency parsing improvements.
  - New Python features (`scan`, `extract`, etc.).
- Keep secrets out of git:
  - `.env` is ignored via `.gitignore`.
- For bigger features (e.g., Phase 2 map enhancements), consider using short-lived feature branches and merging back to `main`.

