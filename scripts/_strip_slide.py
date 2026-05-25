"""One-time: strip the legacy `slide` field from all chart JSON files
ahead of the Sheets-driven sync. Runs identically on PowerShell, cmd,
bash, etc. — no shell heredoc required.

Idempotent: re-running on already-stripped files is a no-op."""
import json
from pathlib import Path

DATA_DIR = Path("web/src/data")

def main():
    stripped = 0
    for p in sorted(DATA_DIR.glob("*.json")):
        obj = json.loads(p.read_text(encoding="utf-8"))
        if "slide" in obj:
            obj.pop("slide")
            p.write_text(
                json.dumps(obj, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            stripped += 1
            print(f"stripped slide from {p.name}")
        else:
            print(f"  ({p.name} already clean)")
    print(f"Done: {stripped} file(s) modified.")

if __name__ == "__main__":
    main()
