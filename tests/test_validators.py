# tests/test_validators.py
from scripts.lib.validators import validate

GOOD_CHART = {
    "id": "students-all", "section": "education", "chart_type": "line",
    "title": {"th": "x", "en": "y"}, "subtitle": {"th": "x", "en": "y"},
    "categories_buddhist": ["2566", "2567", "2568"],
    "series": [
        {"key": "bachelor", "name": {"th": "x", "en": "y"}, "color": "#000000",
         "values": [1, 2, 3]},
    ],
    "methodology": {"th": "x", "en": "y"},
    "source": {"th": "x", "en": "y"},
}
STYLE_CHARTS = {"students-all": {"section": "education", "chart_type": "line",
                                  "kpi_series_key": "bachelor"}}
STYLE_SERIES = {("students-all", "bachelor"): {"color": "#000000", "flags": []}}

def test_valid_chart_produces_no_errors():
    errors = validate({"EDU-students-all": GOOD_CHART}, STYLE_CHARTS, STYLE_SERIES)
    assert errors == []

def test_duplicate_years_flagged():
    bad = {**GOOD_CHART, "categories_buddhist": ["2566", "2566", "2568"]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("duplicate" in e["message_en"].lower() for e in errors)

def test_unsorted_years_flagged():
    bad = {**GOOD_CHART, "categories_buddhist": ["2568", "2566", "2567"]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("sorted" in e["message_en"].lower() for e in errors)

def test_value_count_mismatch_flagged():
    bad_series = {**GOOD_CHART["series"][0], "values": [1, 2]}  # only 2 of 3 years
    bad = {**GOOD_CHART, "series": [bad_series]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("value count" in e["message_en"].lower() for e in errors)

def test_missing_text_field_flagged():
    bad = {**GOOD_CHART, "methodology": {"th": "", "en": "x"}}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("methodology" in e["message_en"].lower() for e in errors)

def test_chart_id_not_in_style_flagged():
    bad = {**GOOD_CHART, "id": "ghost"}
    errors = validate({"EDU-ghost": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("ghost" in e["message_en"] and "STYLE-charts" in e["message_en"] for e in errors)

def test_series_key_not_in_style_flagged():
    bad_series = {**GOOD_CHART["series"][0], "key": "phantom"}
    bad = {**GOOD_CHART, "series": [bad_series]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("phantom" in e["message_en"] and "STYLE-series" in e["message_en"] for e in errors)

def test_duplicate_series_key_flagged():
    s = GOOD_CHART["series"][0]
    bad = {**GOOD_CHART, "series": [s, s]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("duplicate series_key" in e["message_en"].lower() for e in errors)

def test_missing_chart_tab_for_declared_chart_id():
    errors = validate({}, STYLE_CHARTS, STYLE_SERIES)
    assert any("missing chart tab" in e["message_en"].lower()
               and "students-all" in e["message_en"] for e in errors)

def test_year_out_of_range_flagged():
    bad = {**GOOD_CHART, "categories_buddhist": ["2566", "2567", "9999"]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("9999" in e["message_en"] and "outside" in e["message_en"] for e in errors)

def test_non_integer_year_flagged():
    bad = {**GOOD_CHART, "categories_buddhist": ["2566", "abc", "2568"]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("'abc'" in e["message_en"] and "integer" in e["message_en"] for e in errors)

def test_blank_series_name_flagged():
    bad_series = {**GOOD_CHART["series"][0], "name": {"th": "", "en": "Bachelor's"}}
    bad = {**GOOD_CHART, "series": [bad_series]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("name (TH)" in e["message_en"] for e in errors)

def test_blank_series_key_in_middle_flagged():
    """Critical: parser keeps blank-key entries; validator must surface them."""
    blank = {"key": "", "name": {"th": "", "en": ""}, "color": "", "values": [1, 2, 3]}
    bad = {**GOOD_CHART, "series": [GOOD_CHART["series"][0], blank]}
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, STYLE_SERIES)
    assert any("empty series_key" in e["message_en"] for e in errors)

def test_invalid_hex_color_in_style_flagged():
    bad_style = {("students-all", "bachelor"): {"color": "red", "flags": []}}
    errors = validate({"EDU-students-all": GOOD_CHART}, STYLE_CHARTS, bad_style)
    assert any("invalid hex color" in e["message_en"] for e in errors)

def test_unknown_flag_in_style_flagged():
    bad_style = {("students-all", "bachelor"): {"color": "#000000", "flags": ["bogus"]}}
    errors = validate({"EDU-students-all": GOOD_CHART}, STYLE_CHARTS, bad_style)
    assert any("unknown flag" in e["message_en"] and "bogus" in e["message_en"] for e in errors)

def test_series_declared_in_style_but_missing_from_tab_flagged():
    """Critical: prevents data collector from deleting a header row and
    crashing the React KpiCard which does `series.values` directly."""
    # STYLE-series declares two series; chart only has 'bachelor'
    style = {
        ("students-all", "bachelor"): {"color": "#000000", "flags": []},
        ("students-all", "extra"):    {"color": "#111111", "flags": []},
    }
    errors = validate({"EDU-students-all": GOOD_CHART}, STYLE_CHARTS, style)
    assert any("'extra'" in e["message_en"] and "missing from chart tab" in e["message_en"]
               for e in errors)

def test_chart_with_zero_series_flagged():
    """Critical: catches the case where user blanks BOTH STYLE-series
    rows AND chart-tab headers -- previous cross-check would pass with
    empty expected_by_chart, but publishing series:[] crashes React."""
    bad = {**GOOD_CHART, "series": []}
    # Empty STYLE-series so cross-check passes
    errors = validate({"EDU-students-all": bad}, STYLE_CHARTS, {})
    assert any("zero series" in e["message_en"] for e in errors)

def test_kpi_series_key_not_in_chart_flagged():
    """Catches a STYLE-charts kpi_series_key that doesn't match any
    series in the chart tab -- KpiCard would silently fall back to the
    wrong series."""
    # STYLE-charts says KPI is 'phantom' but chart only has 'bachelor'
    style_charts = {"students-all": {"section": "education", "chart_type": "line",
                                      "kpi_series_key": "phantom"}}
    style_series = {("students-all", "bachelor"): {"color": "#000000", "flags": []}}
    errors = validate({"EDU-students-all": GOOD_CHART}, style_charts, style_series)
    assert any("kpi_series_key 'phantom'" in e["message_en"] for e in errors)

def test_blank_kpi_series_key_flagged():
    """Blank STYLE-charts.kpi_series_key must be rejected explicitly --
    falling back to series[0] in KpiCard would silently publish the
    wrong KPI without any signal at validation time."""
    style_charts = {"students-all": {"section": "education", "chart_type": "line",
                                      "kpi_series_key": ""}}
    errors = validate({"EDU-students-all": GOOD_CHART}, style_charts, STYLE_SERIES)
    assert any("must declare kpi_series_key" in e["message_en"] for e in errors)

def test_year_range_string_accepted():
    """The *-3yr charts use NNNN-NNNN year ranges. These must validate."""
    chart = {**GOOD_CHART,
             "categories_buddhist": ["2536-2538", "2539-2541", "2542-2544"]}
    # Adjust series values to match year count
    chart["series"] = [{**chart["series"][0], "values": [1, 2, 3]}]
    errors = validate({"EDU-students-all": chart}, STYLE_CHARTS, STYLE_SERIES)
    assert errors == []

def test_year_range_with_endpoint_out_of_range_flagged():
    chart = {**GOOD_CHART, "categories_buddhist": ["2536-9999"]}
    chart["series"] = [{**chart["series"][0], "values": [1]}]
    errors = validate({"EDU-students-all": chart}, STYLE_CHARTS, STYLE_SERIES)
    assert any("outside" in e["message_en"] for e in errors)

def test_year_range_start_greater_than_end_flagged():
    chart = {**GOOD_CHART, "categories_buddhist": ["2566-2564"]}
    chart["series"] = [{**chart["series"][0], "values": [1]}]
    errors = validate({"EDU-students-all": chart}, STYLE_CHARTS, STYLE_SERIES)
    assert any("start > end" in e["message_en"] for e in errors)

def test_duplicate_chart_id_across_tabs_flagged():
    """Critical: prevents silent overwrite when user duplicates a tab.
    Two different tabs both claim chart_id='students-all' -- write_charts
    would silently overwrite one with the other."""
    errors = validate(
        {"EDU-students-all": GOOD_CHART, "EDU-students-all-copy": GOOD_CHART},
        STYLE_CHARTS, STYLE_SERIES,
    )
    assert any("duplicate chart_id" in e["message_en"] and "students-all" in e["message_en"]
               for e in errors)
