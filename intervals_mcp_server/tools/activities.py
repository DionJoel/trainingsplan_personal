from typing import Any

from intervals_mcp_server.api.client import make_intervals_request
from intervals_mcp_server.config import get_config
from intervals_mcp_server.mcp_instance import mcp


def _format_activity_summary(activity: dict[str, Any]) -> str:
    name = activity.get("name") or activity.get("title") or "Unbenannt"
    start_time = activity.get("startTime") or activity.get("start_date") or "unbekannt"
    duration = activity.get("duration") or activity.get("elapsed_time") or "unbekannt"
    return f"- {name}: Start {start_time}, Dauer {duration}"


@mcp.tool()
async def get_activities(
    athlete_id: str | None = None,
    api_key: str | None = None,
    oldest: str | None = None,
    newest: str | None = None,
    limit: int = 10,
) -> str:
    """Get activities for an athlete from Intervals.icu."""
    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."

    params = {"oldest": oldest, "newest": newest, "limit": limit}
    result = await make_intervals_request(
        f"/athlete/{athlete_id}/activities", api_key=api_key, params=params
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    if not result:
        return "Keine Aktivitäten gefunden."

    activities = result if isinstance(result, list) else [result]
    summaries = [_format_activity_summary(item) for item in activities[:limit] if isinstance(item, dict)]
    return "Aktivitäten:\n" + "\n".join(summaries)
