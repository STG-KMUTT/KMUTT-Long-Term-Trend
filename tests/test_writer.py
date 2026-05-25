# tests/test_writer.py
import json
from scripts.lib.writer import write_charts, json_equal

CHART = {
    "id": "students-all", "section": "education", "chart_type": "line",
    "title": {"th": "x", "en": "y"}, "subtitle": {"th": "x", "en": "y"},
    "categories_buddhist": ["2566", "2567"],
    "series": [{"key": "bachelor", "name": {"th": "x", "en": "y"},
                "color": "#000000", "values": [1, 2]}],
    "methodology": {"th": "x", "en": "y"},
    "source": {"th": "x", "en": "y"},
}

def test_write_creates_new_files(tmp_path):
    changed = write_charts([CHART], tmp_path)
    assert changed == ["students-all.json"]
    written = json.loads((tmp_path / "students-all.json").read_text(encoding="utf-8"))
    assert written["id"] == "students-all"
    assert written["categories_buddhist"] == ["2566", "2567"]

def test_write_skips_unchanged_files(tmp_path):
    write_charts([CHART], tmp_path)
    changed = write_charts([CHART], tmp_path)
    assert changed == []

def test_write_reports_modified_files(tmp_path):
    write_charts([CHART], tmp_path)
    modified = {**CHART, "categories_buddhist": ["2566", "2567", "2568"],
                "series": [{**CHART["series"][0], "values": [1, 2, 3]}]}
    changed = write_charts([modified], tmp_path)
    assert changed == ["students-all.json"]

def test_json_equal_ignores_key_order(tmp_path):
    a = {"a": 1, "b": 2}
    b = {"b": 2, "a": 1}
    assert json_equal(a, b)
