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

## Updating data from a new PPT

1. Drop the new `.pptx` next to this README (keep the filename or update `build_chart_json.py`).
2. From the repo root:
   ```bash
   pip install python-pptx
   python build_chart_json.py
   ```
3. Inspect the diff in `web/src/data/*.json`, commit, push.

Translations and methodology notes live in `build_chart_json.py` (per-slide `SPECS` dict)
so they survive re-extraction.

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
