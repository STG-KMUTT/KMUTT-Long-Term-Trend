"""Write ChartData dicts as JSON, idempotent on no-change."""
import json
from pathlib import Path
from .types import ChartData

INDENT = 2


def _canonical(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=INDENT, sort_keys=True)


def _normalize_numbers(obj):
    """Recursively coerce whole-number floats to int so that 12 and 12.0
    compare as equal in json_equal().

    Required because the source JSONs under web/src/data/ use inconsistent
    number-form styles - some files write 12.0, others write 611, and a
    few mix - so any choice of float vs int in the parser output would
    show up as a phantom diff against half of the source files even
    when nothing has actually changed in the workbook.
    """
    if isinstance(obj, float) and obj.is_integer():
        return int(obj)
    if isinstance(obj, dict):
        return {k: _normalize_numbers(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_normalize_numbers(x) for x in obj]
    return obj


def json_equal(a, b) -> bool:
    return _canonical(_normalize_numbers(a)) == _canonical(_normalize_numbers(b))


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
