"""One-shot migration: move the consolidated 📝 TAKEAWAYS tab into per-chart
KEY TAKEAWAY (TH/EN) rows inside each chart tab, then delete the consolidated tab.

This is the surgical counterpart to a full re-bootstrap: it touches ONLY the two
new metadata rows in each chart tab (and removes the now-redundant consolidated
tab). The existing data table, protected ranges, data validations, and
conditional formats are all auto-shifted down two rows by Sheets when the rows
are inserted — nothing else is rewritten.

Idempotent: a chart tab that already has "KEY TAKEAWAY (TH)" at row 12 (0-indexed
11) is skipped, so re-runs are safe.

For each chart tab (EDU-/PER-/RES-/FIN-):
  1. read chart_id (B1)
  2. skip if row 12 already says "KEY TAKEAWAY (TH)"
  3. insert 2 rows before row 12 → KEY TAKEAWAY (TH) and (EN), seeded from the
     consolidated tab by chart_id
  4. freeze through the (now shifted) Year header at row 19

Usage (Windows PowerShell):
  $env:PYTHONUTF8=1
  python scripts\\migrate_takeaways_to_chart_tabs.py `
    --sheet-id <id> --credentials "$env:USERPROFILE\\.config\\kmutt-sa.json"

  # test on one tab first (also keeps the consolidated tab):
  python scripts\\migrate_takeaways_to_chart_tabs.py --only students-all ...

Pre-condition: the service account must have EDITOR access (and be in the
chart tabs' protected-range editor list, which bootstrap arranges).
"""
import argparse

import gspread
from google.oauth2.service_account import Credentials

SECTION_PREFIXES = ("EDU-", "PER-", "RES-", "FIN-")
INSERT_AT = 11  # 0-indexed row for KEY TAKEAWAY (TH); sheet row 12


def read_consolidated_takeaways(sh):
    """Return ({chart_id: (th, en)}, worksheet_or_None) from 📝 TAKEAWAYS."""
    ws = next((w for w in sh.worksheets() if "TAKEAWAYS" in w.title), None)
    out: dict[str, tuple[str, str]] = {}
    if ws is not None:
        for row in ws.get_all_values()[1:]:
            if not row or not row[0].strip():
                continue
            cid, th, en = (row + ["", "", ""])[:3]
            out[cid.strip()] = (th, en)
    return out, ws


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet-id", required=True)
    ap.add_argument("--credentials", required=True)
    ap.add_argument("--only", default=None,
                    help="Migrate only chart tabs whose title contains this "
                         "substring (for a safe single-tab test).")
    ap.add_argument("--keep-consolidated", action="store_true",
                    help="Do not delete the 📝 TAKEAWAYS tab afterwards.")
    args = ap.parse_args()

    creds = Credentials.from_service_account_file(
        args.credentials, scopes=["https://www.googleapis.com/auth/spreadsheets"])
    sh = gspread.authorize(creds).open_by_key(args.sheet_id)
    print(f"Opened workbook: {sh.title!r}")

    takeaways, consolidated_ws = read_consolidated_takeaways(sh)
    print(f"Read {len(takeaways)} takeaways from the consolidated tab "
          f"({'present' if consolidated_ws else 'absent'}).")

    migrated, skipped = [], []
    for ws in sh.worksheets():
        if not ws.title.startswith(SECTION_PREFIXES):
            continue
        if args.only and args.only not in ws.title:
            continue
        values = ws.get_all_values()
        chart_id = values[0][1].strip() if values and len(values[0]) > 1 else ""
        a12 = (values[INSERT_AT][0].strip()
               if len(values) > INSERT_AT and values[INSERT_AT] else "")
        if a12.startswith("KEY TAKEAWAY"):
            skipped.append(ws.title)
            continue
        th, en = takeaways.get(chart_id, ("", ""))
        ws.insert_rows(
            [["KEY TAKEAWAY (TH)", th], ["KEY TAKEAWAY (EN)", en]],
            row=INSERT_AT + 1,          # 1-indexed: insert before sheet row 12
            inherit_from_before=False,
        )
        try:
            ws.freeze(rows=19)          # through the shifted "Year (พ.ศ.)" header
        except Exception as e:
            print(f"  (note: freeze failed on {ws.title}: {e})")
        migrated.append(ws.title)
        print(f"  migrated {ws.title}  (chart_id={chart_id!r}, "
              f"th={'Y' if th else '-'} en={'Y' if en else '-'})")

    print(f"Migrated {len(migrated)} tab(s); skipped {len(skipped)} already-migrated.")

    if consolidated_ws and not args.keep_consolidated and not args.only:
        sh.del_worksheet(consolidated_ws)
        print("Deleted the consolidated 📝 TAKEAWAYS tab.")
    elif args.only:
        print("(--only set: consolidated tab left in place.)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
