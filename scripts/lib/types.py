"""Type definitions for the Sheets-sync pipeline.

Mirrors the JSON schema defined in
docs/superpowers/specs/2026-05-25-google-sheets-data-source-design.md
"""
from typing import TypedDict, Literal, NotRequired


class Bilingual(TypedDict):
    th: str
    en: str


class SeriesData(TypedDict, total=False):
    key: str               # required
    name: Bilingual        # required
    color: str             # required (from STYLE-series)
    values: list[float | None]  # required
    emphasis: bool         # optional
    exclude_from_stack: bool  # optional
    is_cumulative: bool    # optional


Section = Literal["education", "personnel", "research", "finance"]
ChartType = Literal["line", "stacked-bar", "clustered-bar"]


class ChartData(TypedDict):
    id: str
    section: Section
    chart_type: ChartType
    title: Bilingual
    subtitle: Bilingual
    categories_buddhist: list[str]
    series: list[SeriesData]
    methodology: Bilingual
    source: Bilingual
    # Editorial "Key takeaway", sourced from the 📝 TAKEAWAYS tab. Optional:
    # only attached when that tab supplies non-blank text (see sync_from_sheets).
    # The web falls back to web/src/data/takeaways.ts when this is absent.
    key_takeaway: NotRequired[Bilingual]


class StyleChart(TypedDict):
    section: Section
    chart_type: ChartType
    kpi_series_key: str  # series key the React KpiCard highlights


class StyleSeries(TypedDict):
    color: str
    flags: list[str]  # subset of ["emphasis", "exclude_from_stack", "is_cumulative"]


class ValidationError(TypedDict):
    tab: str | None
    field: str | None
    message_th: str
    message_en: str
