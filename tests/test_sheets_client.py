# tests/test_sheets_client.py
from unittest.mock import MagicMock
from scripts.lib.sheets_client import SheetsClient, classify_tab

def test_classify_tab_recognises_section_prefixes():
    assert classify_tab("EDU-students-all") == "chart"
    assert classify_tab("PER-staff-total") == "chart"
    assert classify_tab("RES-patents") == "chart"
    assert classify_tab("FIN-income-expense") == "chart"

def test_classify_tab_recognises_admin_tabs():
    assert classify_tab("📋 INDEX") == "index"
    assert classify_tab("🎨 STYLE-charts") == "style-charts"
    assert classify_tab("🎨 STYLE-series") == "style-series"
    assert classify_tab("📝 TAKEAWAYS") == "takeaways"

def test_classify_tab_ignores_underscore_prefix():
    assert classify_tab("_scratch") == "ignore"

def test_classify_tab_unknown_returns_unknown():
    assert classify_tab("random-tab") == "unknown"

def test_sheets_client_get_all_chart_tabs(mocker):
    fake_gc = mocker.MagicMock()
    fake_sheet = mocker.MagicMock()
    fake_gc.open_by_key.return_value = fake_sheet
    tab1 = mocker.MagicMock(); tab1.title = "EDU-students-all"
    tab1.get_all_values.return_value = [["a"]]
    tab2 = mocker.MagicMock(); tab2.title = "🎨 STYLE-charts"
    tab3 = mocker.MagicMock(); tab3.title = "_scratch"
    fake_sheet.worksheets.return_value = [tab1, tab2, tab3]

    client = SheetsClient(gc=fake_gc, sheet_id="abc")
    chart_tabs = client.get_chart_tabs()
    assert list(chart_tabs.keys()) == ["EDU-students-all"]

def _client_with_tabs(mocker, tabs):
    fake_gc = mocker.MagicMock()
    fake_sheet = mocker.MagicMock()
    fake_gc.open_by_key.return_value = fake_sheet
    fake_sheet.worksheets.return_value = tabs
    return SheetsClient(gc=fake_gc, sheet_id="abc")

def test_get_takeaways_returns_values_when_tab_present(mocker):
    tab = mocker.MagicMock(); tab.title = "📝 TAKEAWAYS"
    tab.get_all_values.return_value = [["chart_id", "takeaway_th", "takeaway_en"]]
    client = _client_with_tabs(mocker, [tab])
    assert client.get_takeaways() == [["chart_id", "takeaway_th", "takeaway_en"]]

def test_get_takeaways_returns_empty_when_tab_absent(mocker):
    tab = mocker.MagicMock(); tab.title = "EDU-students-all"
    client = _client_with_tabs(mocker, [tab])
    assert client.get_takeaways() == []
