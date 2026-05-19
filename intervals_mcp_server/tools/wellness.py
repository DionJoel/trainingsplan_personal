from intervals_mcp_server.api.client import make_intervals_request
from intervals_mcp_server.config import get_config
from intervals_mcp_server.mcp_instance import mcp


def _summarize_wellness(entries: list[dict[str, str]]) -> str:
    if not entries:
        return "Keine Wellness-Daten vorhanden."

    lines = []
    for entry in entries[:10]:
        date = entry.get("date") or entry.get("day") or "unbekannt"
        hrv = entry.get("hrv") or entry.get("rmssd") or "-"
        sleep = entry.get("sleep") or entry.get("sleepHours") or "-"
        lines.append(f"- {date}: HRV {hrv}, Schlaf {sleep}")
    return "\n".join(lines)


@mcp.tool()
async def get_wellness_data(
    athlete_id: str | None = None,
    api_key: str | None = None,
    oldest: str | None = None,
    newest: str | None = None,
) -> str:
    """Fetch wellness data for an athlete from Intervals.icu."""
    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."

    params = {"oldest": oldest, "newest": newest}
    result = await make_intervals_request(
        f"/athlete/{athlete_id}/wellness", api_key=api_key, params=params
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    if not result:
        return "Keine Wellness-Daten gefunden."

    entries = result if isinstance(result, list) else [result]
    return f"Wellness-Daten:\n{_summarize_wellness(entries)}"
