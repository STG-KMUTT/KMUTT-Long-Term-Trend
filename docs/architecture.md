# Architecture: KMUTT Trends Dashboard — Sheets-based data flow

_Developer-facing reference. For the non-developer guide in Thai see
[`docs/data-collector-guide-th.md`](data-collector-guide-th.md). For first-time
repo setup see [`docs/runbook-initial-setup.md`](runbook-initial-setup.md)._

---

## 1. Overview — end-to-end data flow

```
┌─────────────────────────────┐
│  Google Sheets workbook     │
│  (INDEX + STYLE_CHARTS +    │
│   STYLE_SERIES + ~20 chart  │
│   tabs)                     │
│                             │
│  Data validation &          │◄── data collector enters values here
│  conditional formats        │    Sheets rejects bad values at entry
└───────────┬─────────────────┘
            │ Apps Script "Publish to Dashboard" menu
            ▼
┌───────────────────────────────┐
│  apps_script/Code.gs          │
│  - _dispatchSync()            │
│    POST /repos/.../dispatches │
│    event: sync-sheets         │
│    payload: { correlation_id, │
│               dry_run,        │
│               user_email }    │
│  - pollStatus()               │
│    polls Actions API every 5s │
└───────────┬───────────────────┘
            │ HTTP POST (GitHub REST API)
            │ Authorization: Bearer <GITHUB_PAT>
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub Actions: .github/workflows/sync-from-sheets.yml             │
│                                                                     │
│  run-name: "Sync from Sheets [<correlation_id>]"                    │
│                                                                     │
│  job: sync                         job: deploy                      │
│  ─────────────────────────────     ──────────────────────────────── │
│  1. Preflight (SHEET_ID set?)      needs: sync                      │
│  2. Write GCP key to /tmp          if: success() && !dry_run        │
│  3. Run scripts/sync_from_sheets.py│                                │
│     → reads Sheets via gspread     concurrency.group: pages         │
│     → validates (2-layer)          (shared with deploy.yml)         │
│     → writes web/src/data/*.json   1. checkout main HEAD            │
│  4. Upload sync-result artifact    2. npm ci && npm run build       │
│  5. Commit + push if changed       3. actions/deploy-pages          │
│  6. outputs.did_commit = true/false│                                │
└─────────────────────────────────────────────────────────────────────┘
            │
            │ sync job commits → pushes to main
            │ deploy job builds web/dist → deploys to Pages
            ▼
┌──────────────────────────────┐
│  GitHub Pages                │
│  (web/dist — static React)   │
│  reads web/src/data/*.json   │
└──────────────────────────────┘
```

### Correlation ID

Apps Script generates a `correlationId` (timestamp + random suffix, e.g.
`20260525T143200_a7f3`) before calling `_dispatchSync`. The workflow's
`run-name:` embeds it:

```yaml
run-name: "Sync from Sheets [${{ github.event.client_payload.correlation_id }}]"
```

The modal then polls `GET /repos/{repo}/actions/runs?event=repository_dispatch&per_page=100`
and finds the run by matching `display_title.includes(correlationId)`. The
`display_title` field reflects the evaluated `run-name:` — NOT the static
workflow `name:`. Using `per_page=100` (GitHub's maximum) guards against the
target run being pushed off the first page in case of burst publishes.

---

## 2. Key files

| File | Purpose | Spec section |
|---|---|---|
| `apps_script/Code.gs` | Server side: dispatches `sync-sheets` event; `pollStatus()` used by modal | Round 4 |
| `apps_script/PublishModal.html` | Client side: progress modal in Sheets; polls via `google.script.run` every 5 s | Round 4 |
| `scripts/sync_from_sheets.py` | Orchestrator: parse → validate → write → emit `result.json` / `errors.json` | Round 2 |
| `scripts/bootstrap_sheets.py` | One-time: creates tabs, headers, data-validation rules, protected ranges | Round 5.1 |
| `scripts/lib/sheets_client.py` | `SheetsClient` wrapper around `gspread`; fetches INDEX, STYLE_*, chart tabs | Round 1 |
| `scripts/lib/parsers.py` | `parse_style_charts`, `parse_style_series`, `parse_chart_tab` | Round 1 |
| `scripts/lib/validators.py` | Layer-2 validator: KPI blank, zero-series, year formula checks | Rounds 1, 6, 7 |
| `scripts/lib/writer.py` | Idempotent JSON writer; `json_equal` diff check for dry-run | Round 1 |
| `scripts/lib/types.py` | Python `TypedDict` schema for chart/series/style objects | Round 1 |
| `web/src/types.ts` | TypeScript mirror of `types.py`; consumed by React components | Round 0.5 |
| `web/src/data/*.json` | Generated bilingual chart JSON (one file per chart tab) | — |
| `.github/workflows/sync-from-sheets.yml` | Workflow: `sync` + `deploy` jobs triggered by `repository_dispatch` | Round 3 |
| `.github/workflows/deploy.yml` | Existing push-to-main deploy; shares `pages` concurrency group | — |
| `docs/data-collector-guide-th.md` | Thai user guide for data collectors | Round 6 |
| `docs/runbook-initial-setup.md` | Dev runbook: bootstrap, secrets, Apps Script setup | Round 7 |
| `build_chart_json.py` | **DEPRECATED** legacy PPTX-driven generator; kept for reference | — |

---

## 3. Workbook structure

The Google Sheets workbook has a fixed tab layout that `bootstrap_sheets.py`
creates (and that `sheets_client.py` expects):

| Tab name | Role |
|---|---|
| `INDEX` | Master list of all chart IDs; drives tab enumeration |
| `STYLE_CHARTS` | Per-chart display metadata (title TH/EN, unit, chart type, …) |
| `STYLE_SERIES` | Per-series style overrides (color, dash, area-fill, …) |
| `<chart-id>` (×~20) | One tab per chart; rows are `year, value_1, value_2, …` |

`sheets_client.py` fetches each section via `gspread` using the service
account credentials written to `/tmp/gcp-key.json` during the workflow.

---

## 4. Validation layers

Two independent layers prevent bad data reaching the dashboard.

### Layer 1 — Sheets data validation (at-entry)

`bootstrap_sheets.py` writes Sheets data-validation rules onto chart tabs:

- **Year column**: must match `^\d{4}$` (four-digit year).
- **Value columns**: must be numeric (not text, not blank-where-required).
- **Conditional formats**: cells that fail rules turn red, giving immediate
  visual feedback without leaving the spreadsheet.

This layer catches most mistakes at the point of entry. Data collectors see
an error in the cell immediately and can correct it before publishing.

### Layer 2 — Python validator (`scripts/lib/validators.py`)

Runs inside `sync_from_sheets.py` after parsing, before writing any JSON.
Current checks (see spec for full list):

- **KPI blank**: a chart flagged as KPI must have at least one non-blank
  value series.
- **Zero series**: a series that is entirely zeros is likely a data entry
  error (e.g., values pasted in the wrong column).
- **Year formula**: year values must be parseable as integers; non-integer
  strings (common when a formula cell is left as text) are rejected.
- **Placeholder collision**: a series label must not be the literal string
  `"TBD"` or similar sentinel.

If validation fails, `sync_from_sheets.py` writes `errors.json` and exits
non-zero. The workflow uploads `errors.json` as the `sync-errors` artifact
and the modal displays a structured error list to the user.

---

## 5. Deploy chain design

### Why deploy always runs (even on no-op sync)

The `deploy` job runs `if: success() && !dry_run` — not `if: did_commit`.
This is intentional. If a previous Pages deployment failed mid-flight, the
simplest recovery is "click Publish again". Running deploy unconditionally
on every successful publish ensures the modal's "success" message is
truthful: the dashboard was actually refreshed.

### Concurrency groups

Two concurrency groups prevent races:

| Group | Scope | Purpose |
|---|---|---|
| `sync-from-sheets` | workflow level | Serialises concurrent `sync-sheets` dispatches |
| `pages` | `deploy` job level | Prevents sync-deploy from racing manual deploy or push-triggered deploy |

The `pages` group is shared with `.github/workflows/deploy.yml`, so neither
workflow can stomp the other's Pages deployment. `cancel-in-progress: false`
on both groups means a second run waits rather than cancelling a running deploy.

### GITHUB_TOKEN vs GITHUB_PAT

- **`GITHUB_TOKEN`** (automatic) — used by the `sync` job's `checkout` step
  and `commit+push` step. Sufficient for pushing to the same repo.
- **`GITHUB_PAT`** (repository secret) — used only by Apps Script to call
  `POST /repos/{repo}/dispatches`. A `GITHUB_TOKEN` cannot trigger
  `repository_dispatch` from outside the Actions context.

---

## 6. Credentials and rotation

### GITHUB_PAT

- Type: fine-grained Personal Access Token.
- Required scopes (repository-scoped): **Contents: Read and Write**,
  **Actions: Read**.
- Used by: `apps_script/Code.gs` → `_dispatchSync()`.
- Stored as: GitHub repository secret `GITHUB_PAT`.
- **To rotate**: generate a new fine-grained PAT in GitHub
  Settings → Developer settings → Fine-grained tokens, then update the
  secret at `Settings → Secrets and variables → Actions → GITHUB_PAT`.
  No workflow re-run needed; the new value takes effect on the next dispatch.

### GOOGLE_SERVICE_ACCOUNT_JSON

- Type: GCP service account key (JSON).
- Used by: `sync_from_sheets.py` via `gspread`.
- Stored as: GitHub repository secret `GOOGLE_SERVICE_ACCOUNT_JSON`.
- The service account email must be added as an **Editor** on the Sheets
  workbook (or via the Google Sheets share dialog).
- **To rotate**: in GCP Console → IAM → Service Accounts, select the account,
  go to Keys, add a new JSON key, download it, update the GitHub secret.
  No redeploy needed; the workflow reads the secret at run time.

### KMUTT_TRENDS_SHEET_ID

- Type: GitHub repository **Variable** (not secret — the sheet ID is not
  sensitive, but keeping it out of code makes it easy to swap workbooks).
- Value: the Sheets URL segment between `/d/` and `/edit`.
- Used by: `sync-from-sheets.yml` (passed to `sync_from_sheets.py --sheet-id`).
- **To update**: `Settings → Secrets and variables → Actions → Variables →
  KMUTT_TRENDS_SHEET_ID`.

---

## 7. Debugging tips

### "Validation failed" in the publish modal

1. Open GitHub Actions → find the `Sync from Sheets [<correlation_id>]` run.
2. Download the `sync-errors` artifact — it contains `errors.json`, a list
   of structured `{ tab, field, message_th, message_en }` objects.
3. Fix the offending cells in the sheet. The modal error list is the same
   data, so you can also read it there directly.

### "Modal never finishes / spinner keeps running"

1. Open GitHub Actions UI — look for a run whose display title contains the
   `correlation_id` shown in the modal (format: `YYYYMMDDTHHmmss_xxxx`).
2. If the run doesn't appear, the dispatch itself failed. Check the Apps
   Script execution log (`Extensions → Apps Script → Executions`).
3. If the run is stuck `in_progress`, check the step logs. Common causes:
   `pip install` failure, `gspread` auth error, push permission denied.

### "Dashboard not updating after publish"

1. Check the `deploy` job in the same `Sync from Sheets [...]` run — did it
   complete successfully?
2. If it was skipped: the sync job likely failed or `dry_run` was set. Run
   a full publish (not dry-run).
3. If it failed with "another deployment is in progress": the `pages`
   concurrency queue was backed up. Wait for the earlier deployment to finish
   and publish again.
4. Hard-reload the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`); Pages CDN may
   be serving a cached version.

### "Bootstrap can't delete / update a protected range"

The service account must be in the spreadsheet's **Editor** list (not just
Viewer). In Google Sheets → Share, add the service account email as an
Editor. See spec rounds 5.1, 6, and 7 for the history of this constraint.

### "Sheets value rejected at entry (cell turns red)"

Sheets data-validation rules set by `bootstrap_sheets.py` are enforcing
column constraints:

- Year column: must be a 4-digit integer (e.g. `2025`, not `BE2568`).
- Value columns: must be numeric; do not enter text or leave a formula that
  evaluates to a string.

Correct the cell value. If a whole column has wrong rules, re-run bootstrap
with `--force` to rebuild the validation (see
[`docs/runbook-initial-setup.md`](runbook-initial-setup.md)).

### "KMUTT_TRENDS_SHEET_ID is unset"

The preflight step in `sync-from-sheets.yml` writes a structured
`errors.json` and exits before any Sheets I/O. Add the variable at
`Settings → Secrets and variables → Actions → Variables`.

---

## 8. Security notes

### Shell-injection prevention

All user-supplied values that flow from the `repository_dispatch` payload
into shell commands are passed through `env:` blocks rather than direct
`${{ ... }}` interpolation in `run:` steps. This prevents a crafted payload
(e.g. `abc"; rm -rf /`) from being interpreted as shell tokens.

The `SHEET_ID` is read from a GitHub repository **Variable** set by a repo
admin — not from the dispatch payload — so an attacker who has obtained a
PAT cannot redirect the workflow at a sheet they control.

### `repository_dispatch` rate limiting

The Apps Script modal imposes a single in-flight publish at a time (the
button is disabled while the modal is open). The workflow-level concurrency
group `sync-from-sheets` serialises any concurrent dispatches that slip
through (e.g. two browser tabs open simultaneously).

---

## 9. Where to look when things break

| Symptom | First place to look |
|---|---|
| Modal shows error list | `sync-errors` artifact → `errors.json` |
| Modal spins forever | GitHub Actions UI → display_title search |
| Dashboard stale | `deploy` job logs in the same workflow run |
| Auth / credential error | GCP Console → Service Accounts → Keys |
| Sheets bootstrap fails | Add service account as Editor on the spreadsheet |
| Workflow not triggered | Apps Script execution log |

For historical context on design decisions, see the spec document (link below)
— rounds 3–7 document successive refinements in response to code review.

---

## See also

- **Design spec**: [`docs/superpowers/specs/2026-05-25-google-sheets-data-source-design.md`](superpowers/specs/2026-05-25-google-sheets-data-source-design.md)
- **Implementation plan**: [`docs/superpowers/plans/2026-05-25-google-sheets-data-source.md`](superpowers/plans/2026-05-25-google-sheets-data-source.md)
- **Data collector guide (Thai)**: [`docs/data-collector-guide-th.md`](data-collector-guide-th.md)
- **Initial setup runbook**: [`docs/runbook-initial-setup.md`](runbook-initial-setup.md) _(added in Phase 7)_
