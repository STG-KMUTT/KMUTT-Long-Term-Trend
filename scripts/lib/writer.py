"""Write ChartData dicts as JSON, idempotent on no-change."""
import json
from pathlib import Path
from .types import ChartData

INDENT = 2


def _canonical(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=INDENT, sort_keys=True)


def json_equal(a, b) -> bool:
    return _canonical(a) == _canonical(b)


def write_charts(charts: list[ChartData], out_dir: Path) -> list[str]:
    """Write one JSON file per chart. Returns list of changed filenames."""
    out_dir.mkdir(parents=True, exist_ok=True)
    changed: list[str] = []
    for chart in charts:
        filename = f"{chart['id']}.json"
        target = out_dir / filename
        if target.exists():
            existing = json.loads(target.read_text(encoding="utf-8"))
            if json_equal(existing, chart):
                continue
        # Write WITHOUT sort_keys so the file matches the natural order
        # callers prefer; equality check uses sort_keys for stability.
        # Append "\n" to match the Phase 0.5 strip-script output — without
        # this, the first sync after schema-cleanup would diff every file
        # purely on trailing-newline mismatch.
        target.write_text(
            json.dumps(chart, ensure_ascii=False, indent=INDENT) + "\n",
            encoding="utf-8",
        )
        changed.append(filename)
    return sorted(changed)
