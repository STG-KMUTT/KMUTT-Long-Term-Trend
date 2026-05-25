# KMUTT Long-Term Trends

Interactive bilingual (TH/EN) web dashboard built from the annual
*KMUTT Trend* PowerPoint. Currently a **prototype** showing 3 of 22 charts —
to validate the look + tech stack before scaling to the full deck.

Audience: KMUTT executives. Public read access (no login). Hosted on GitHub Pages.

## Repo layout

```
.
├── KMUTT Long Term Trend 2568-(@19052569).pptx   ← source deck (input)
├── extract_pptx.py        ← dumps raw slide text (debug / overview)
├── build_chart_json.py    ← extracts chart data → web/src/data/*.json
├── slides_full.txt        ← gitignored text dump
└── web/                   ← the React app
    ├── src/
    │   ├── data/          ← bilingual chart JSON (generated)
    │   ├── components/    ← Chart / KpiCard / MethodologyNote / LanguageToggle
    │   ├── i18n.tsx       ← TH/EN context + UI strings
    │   ├── types.ts
    │   └── App.tsx
    └── public/
```

## Local development

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

## Updating data

The dashboard is driven by `web/src/data/*.json` files. These are generated
from a Google Sheets workbook via a "Publish to Dashboard" menu button — no
Git or CLI required for day-to-day data updates.

The workbook has a fixed tab layout: one `INDEX` tab, two style tabs
(`STYLE_CHARTS`, `STYLE_SERIES`), and approximately 20 chart tabs (one per
chart). Data collectors edit the chart tabs and click **Publish all changes**;
an Apps Script triggers a GitHub Actions workflow that validates, commits the
JSON, and redeploys GitHub Pages automatically.

**For data collectors:** see [`docs/data-collector-guide-th.md`](docs/data-collector-guide-th.md) (Thai).

**For developers:** see [`docs/architecture.md`](docs/architecture.md) for the
end-to-end architecture, [`docs/runbook-initial-setup.md`](docs/runbook-initial-setup.md)
for first-time repo + Sheets setup, and
[`docs/superpowers/specs/2026-05-25-google-sheets-data-source-design.md`](docs/superpowers/specs/2026-05-25-google-sheets-data-source-design.md)
for the design rationale.

The legacy PPTX-driven flow (`build_chart_json.py`) is deprecated but retained
for reference until one full annual cycle of the Sheets-based flow has been
completed.

## Deployment (GitHub Pages)

The workflow at `.github/workflows/deploy.yml` builds and deploys automatically
when you push to `main`. One-time setup:

1. Push this repo to GitHub (e.g. `github.com/<org>/<repo>`).
2. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` — the workflow builds `web/` with `VITE_BASE=/<repo>/` and publishes.

The site will be live at `https://<org>.github.io/<repo>/`.

## Tech

- Vite + React 19 + TypeScript + Tailwind v3
- ECharts (via `echarts-for-react`) — canvas renderer
- No backend, no auth, no analytics. Static files only.
