from scripts.bootstrap_sheets import build_chart_tab_values, build_style_charts_rows, build_style_series_rows

SAMPLE = {
    "id": "students-all", "section": "education", "chart_type": "line",
    "title": {"th": "x", "en": "y"}, "subtitle": {"th": "x", "en": "y"},
    "categories_buddhist": ["2566", "2567"],
    "series": [
        {"key": "bachelor", "name": {"th": "ป.ตรี", "en": "B"}, "color": "#000000", "values": [1, 2]},
        {"key": "total", "name": {"th": "รวม", "en": "T"}, "color": "#fff", "values": [3, 4], "emphasis": True},
    ],
    "methodology": {"th": "x", "en": "y"},
    "source": {"th": "x", "en": "y"},
}

def test_chart_tab_values_metadata_layout():
    rows = build_chart_tab_values(SAMPLE)
    assert rows[0] == ["Chart ID", "students-all"]
    assert rows[2] == ["TITLE (TH)", "x"]
    # KEY TAKEAWAY rows (idx 11/12) — blank when the JSON has no key_takeaway.
    assert rows[11] == ["KEY TAKEAWAY (TH)", ""]
    assert rows[12] == ["KEY TAKEAWAY (EN)", ""]
    # Data-table block sits two rows lower than the original schema.
    assert rows[15] == ["series_key →", "bachelor", "total"]
    assert rows[19] == ["2566", 1, 3]
    assert rows[20] == ["2567", 2, 4]

def test_chart_tab_values_seeds_key_takeaway_from_json():
    sample = {**SAMPLE, "key_takeaway": {"th": "ไทย", "en": "EN"}}
    rows = build_chart_tab_values(sample)
    assert rows[11] == ["KEY TAKEAWAY (TH)", "ไทย"]
    assert rows[12] == ["KEY TAKEAWAY (EN)", "EN"]

def test_style_series_emits_flags_csv():
    rows = build_style_series_rows([SAMPLE])
    total_row = next(r for r in rows if r[1] == "total")
    assert total_row[3] == "emphasis"
