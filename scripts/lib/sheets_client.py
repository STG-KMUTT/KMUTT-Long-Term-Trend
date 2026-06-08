"""Thin wrapper around gspread. Read-only by design."""
from typing import Literal

import gspread
from google.oauth2.service_account import Credentials

TabKind = Literal["chart", "index", "style-charts", "style-series", "ignore", "unknown"]

SECTION_PREFIXES = ("EDU-", "PER-", "RES-", "FIN-")


def classify_tab(name: str) -> TabKind:
    if name.startswith("_"):
        return "ignore"
    if name.startswith(SECTION_PREFIXES):
        return "chart"
    if "INDEX" in name:
        return "index"
    if "STYLE-charts" in name:
        return "style-charts"
    if "STYLE-series" in name:
        return "style-series"
    return "unknown"


class SheetsClient:
    def __init__(self, gc=None, sheet_id: str = "", credentials_path: str | None = None):
        if gc is None:
            scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            creds = Credentials.from_service_account_file(credentials_path, scopes=scopes)
            gc = gspread.authorize(creds)
        self._gc = gc
        self._sheet = gc.open_by_key(sheet_id)

    def get_chart_tabs(self) -> dict[str, list[list[str]]]:
        out: dict[str, list[list[str]]] = {}
        for ws in self._sheet.worksheets():
            if classify_tab(ws.title) == "chart":
                out[ws.title] = ws.get_all_values()
        return out

    def get_style_charts(self) -> list[list[str]]:
        for ws in self._sheet.worksheets():
            if classify_tab(ws.title) == "style-charts":
                return ws.get_all_values()
        raise RuntimeError("STYLE-charts tab not found")

    def get_style_series(self) -> list[list[str]]:
        for ws in self._sheet.worksheets():
            if classify_tab(ws.title) == "style-series":
                return ws.get_all_values()
        raise RuntimeError("STYLE-series tab not found")
