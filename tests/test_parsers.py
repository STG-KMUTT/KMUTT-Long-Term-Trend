# tests/test_parsers.py
import json
from pathlib import Path
import pytest
from scripts.lib.parsers import parse_style_charts, parse_style_series

FIXTURES = Path(__file__).parent / "fixtures"

def load(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))

def test_parse_style_charts_returns_dict_keyed_by_chart_id():
    rows = load("style-charts-rows.json")
    result = parse_style_charts(rows)
    assert result == {
        "students-all": {"section": "education", "chart_type": "line", "kpi_series_key": "total"},
        "patents": {"section": "research", "chart_type": "clustered-bar", "kpi_series_key": "patent_filed"},
    }

def test_parse_style_charts_skips_blank_rows():
    rows = [
        ["chart_id", "section", "chart_type", "kpi_series_key"],
        ["", "", "", ""],
        ["students-all", "education", "line", "total"],
    ]
    assert parse_style_charts(rows) == {
        "students-all": {"section": "education", "chart_type": "line", "kpi_series_key": "total"},
    }

def test_parse_style_series_returns_dict_keyed_by_tuple():
    rows = load("style-series-rows.json")
    result = parse_style_series(rows)
    assert result[("students-all", "bachelor")] == {"color": "#f29400", "flags": []}
    assert result[("students-all", "total")] == {"color": "#0f172a", "flags": ["emphasis"]}

def test_parse_style_series_handles_multiple_flags():
    rows = [
        ["chart_id", "series_key", "color", "flags"],
        ["x", "y", "#000000", "emphasis,is_cumulative"],
    ]
    assert parse_style_series(rows)[("x", "y")]["flags"] == ["emphasis", "is_cumulative"]
