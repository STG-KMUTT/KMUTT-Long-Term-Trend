import json
from pathlib import Path
from unittest.mock import MagicMock
from scripts.sync_from_sheets import run_sync

FIX = Path(__file__).parent / "fixtures"

def make_fake_client():
    """Orchestrator test client: declares ONLY students-all in STYLE-charts.

    The shared style-charts-rows.json fixture also lists 'patents' for
    parser/validator tests, but the orchestrator test only provides a
    students-all chart tab — using the full fixture would (correctly)
    trigger the validator's 'missing chart tab for patents' cross-check
    and fail every happy-path test."""
    client = MagicMock()
    client.get_chart_tabs.return_value = {
        "EDU-students-all": json.loads((FIX / "students-all-rows.json").read_text(encoding="utf-8"))
    }
    client.get_style_charts.return_value = [
        ["chart_id", "section", "chart_type", "kpi_series_key"],
        ["students-all", "education", "line", "total"],
    ]
    # style-series fixture already only has students-all entries
    client.get_style_series.return_value = json.loads((FIX / "style-series-rows.json").read_text(encoding="utf-8"))
    # TAKEAWAYS tab is optional; default to absent (empty) for happy-path tests.
    client.get_takeaways.return_value = []
    return client

def test_run_sync_writes_json_and_returns_changed_list(tmp_path):
    client = make_fake_client()
    result = run_sync(client, out_dir=tmp_path, dry_run=False)
    assert result["status"] == "success"
    assert "students-all.json" in result["changed_files"]
    assert (tmp_path / "students-all.json").exists()

def test_run_sync_dry_run_does_not_write(tmp_path):
    client = make_fake_client()
    result = run_sync(client, out_dir=tmp_path, dry_run=True)
    assert result["status"] == "success"
    assert "students-all.json" in result["changed_files"]
    assert not (tmp_path / "students-all.json").exists()

def test_run_sync_merges_takeaway_when_present(tmp_path):
    client = make_fake_client()
    client.get_takeaways.return_value = [
        ["chart_id", "takeaway_th", "takeaway_en"],
        ["students-all", "ประเด็นไทย", "English point"],
    ]
    result = run_sync(client, out_dir=tmp_path, dry_run=False)
    assert result["status"] == "success"
    written = json.loads((tmp_path / "students-all.json").read_text(encoding="utf-8"))
    assert written["key_takeaway"] == {"th": "ประเด็นไทย", "en": "English point"}

def test_run_sync_omits_takeaway_when_absent(tmp_path):
    client = make_fake_client()  # get_takeaways → [] by default
    result = run_sync(client, out_dir=tmp_path, dry_run=False)
    assert result["status"] == "success"
    written = json.loads((tmp_path / "students-all.json").read_text(encoding="utf-8"))
    assert "key_takeaway" not in written

def test_run_sync_returns_errors_on_validation_failure(tmp_path):
    client = make_fake_client()
    # Corrupt STYLE-charts so chart_id won't match
    client.get_style_charts.return_value = [
        ["chart_id", "section", "chart_type"],
        ["wrong-id", "education", "line"],
    ]
    result = run_sync(client, out_dir=tmp_path, dry_run=False)
    assert result["status"] == "validation_failed"
    assert len(result["errors"]) > 0
