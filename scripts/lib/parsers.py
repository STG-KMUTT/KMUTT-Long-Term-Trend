"""Parsers convert Sheets API row data (list of lists) into typed dicts."""
from .types import StyleChart, StyleSeries, ChartData


def parse_style_charts(rows: list[list[str]]) -> dict[str, StyleChart]:
    """Parse STYLE-charts tab. First row is header, skip blank rows.

    Schema: chart_id | section | chart_type | kpi_series_key
    """
    out: dict[str, StyleChart] = {}
    for row in rows[1:]:
        if not row or not row[0].strip():
            continue
        chart_id, section, chart_type, kpi_key = (row + ["", "", "", ""])[:4]
        out[chart_id.strip()] = {
            "section": section.strip(),  # type: ignore[typeddict-item]
            "chart_type": chart_type.strip(),  # type: ignore[typeddict-item]
            "kpi_series_key": kpi_key.strip(),
        }
    return out


def parse_style_series(rows: list[list[str]]) -> dict[tuple[str, str], StyleSeries]:
    """Parse STYLE-series tab. Returns dict keyed by (chart_id, series_key)."""
    out: dict[tuple[str, str], StyleSeries] = {}
    for row in rows[1:]:
        if not row or not row[0].strip():
            continue
        chart_id, series_key, color, flags_raw = (row + ["", "", "", ""])[:4]
        flags = [f.strip() for f in flags_raw.split(",") if f.strip()]
        out[(chart_id.strip(), series_key.strip())] = {
            "color": color.strip(),
            "flags": flags,
        }
    return out
