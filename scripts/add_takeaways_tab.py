"""Add (or refresh) the 📝 TAKEAWAYS tab in an EXISTING workbook — safely.

Unlike scripts/bootstrap_sheets.py (which deletes and rebuilds the whole
workbook), this script is deliberately NARROW: it touches ONLY the TAKEAWAYS
tab. It never deletes, reorders, or edits any other tab, protected range, data
table, or formatting. Safe to run against a live, in-use workbook.

It seeds the tab's rows from docs/takeaways-for-sheets.tsv (chart_id | th | en),
the same content the web falls back to in web/src/data/takeaways.ts.

Usage (Windows PowerShell):
  $env:PYTHONUTF8=1
  python scripts\\add_takeaways_tab.py `
    --sheet-id <id> --credentials "$env:USERPROFILE\\.config\\kmutt-sa.json"

By default an existing TAKEAWAYS tab is left untouched; pass --overwrite to
replace its contents from the TSV.

Pre-condition: the service account must have EDITOR access to the sheet. If it
was downgraded to Viewer after bootstrap, restore Editor in the Share dialog,
run this once, then optionally downgrade back to Viewer.
"""
import argparse
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

TAB_TITLE = "📝 TAKEAWAYS"


def load_tsv(path: Path) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        rows.append(line.split("\t"))
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet-id", required=True)
    ap.add_argument("--credentials", required=True)
    ap.add_argument("--tsv", default="docs/takeaways-for-sheets.tsv")
    ap.add_argument("--overwrite", action="store_true",
                    help="Replace contents if the tab already exists "
                         "(default: leave an existing tab untouched).")
    args = ap.parse_args()

    rows = load_tsv(Path(args.tsv))
    if not rows or rows[0][:1] != ["chart_id"]:
        print(f"!! {args.tsv} does not look like the takeaways TSV "
              f"(first row: {rows[:1]}). Aborting without changes.")
        return 1

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_file(args.credentials, scopes=scopes)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(args.sheet_id)
    print(f"Opened workbook: {sh.title!r}")

    existing = next((ws for ws in sh.worksheets() if "TAKEAWAYS" in ws.title), None)

    if existing and not args.overwrite:
        print(f"Tab {existing.title!r} already exists -- leaving it untouched. "
              f"Pass --overwrite to replace its contents. No changes made.")
        return 0

    if existing:
        existing.clear()
        existing.update(range_name="A1", values=rows, value_input_option="RAW")
        print(f"Refreshed {existing.title!r}: {len(rows) - 1} takeaway rows written.")
    else:
        ws = sh.add_worksheet(title=TAB_TITLE, rows=max(40, len(rows) + 5), cols=3)
        ws.update(range_name="A1", values=rows, value_input_option="RAW")
        try:
            ws.freeze(rows=1)
        except Exception as e:  # freezing is cosmetic; never fail the whole run on it
            print(f"  (note: could not freeze header row: {e})")
        print(f"Created {TAB_TITLE!r}: {len(rows) - 1} takeaway rows written, "
              f"header frozen.")

    print("Done. The tab is collector-editable (no protection added). "
          "Columns: A=chart_id (do not edit), B=takeaway_th, C=takeaway_en.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
