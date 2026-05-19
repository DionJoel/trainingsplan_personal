from typing import Any

from intervals_mcp_server.api.client import make_intervals_request
from intervals_mcp_server.config import get_config
from intervals_mcp_server.mcp_instance import mcp


def _format_activity_summary(activity: dict[str, Any]) -> str:
    name = activity.get("name") or activity.get("title") or "Unbenannt"
    start_time = activity.get("startTime") or activity.get("start_date") or "unbekannt"
    distance = activity.get("distance") or activity.get("distanceMeters") or "unbekannt"
    duration = activity.get("duration") or activity.get("elapsed_time") or "unbekannt"
    return f"- {name}: Start {start_time}, Dauer {duration}, Distanz {distance}"


def _format_activity_details(activity: dict[str, Any]) -> str:
    if not activity:
        return "Keine Aktivitätsdetails verfügbar."

    summary = _format_activity_summary(activity)
    details = []
    if activity.get("type"):
        details.append(f"Typ: {activity.get('type')}")
    if activity.get("tss") is not None:
        details.append(f"TSS: {activity.get('tss')}")
    if activity.get("heartRateAverage") is not None:
        details.append(f"HR avg: {activity.get('heartRateAverage')}")
    return summary + ("\n" + "\n".join(details) if details else "")


@mcp.tool()
async def get_activities(
    athlete_id: str | None = None,
    api_key: str | None = None,
    oldest: str | None = None,
    newest: str | None = None,
    limit: int = 10,
    include_unnamed: bool = False,
) -> str:
    """Get activities for an athlete from Intervals.icu."""
    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."

    params = {"oldest": oldest, "newest": newest, "limit": limit * (3 if not include_unnamed else 1)}
    result = await make_intervals_request(
        f"/athlete/{athlete_id}/activities", api_key=api_key, params=params
    )

    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    activities = result if isinstance(result, list) else [result]
    if not activities:
        return "Keine Aktivitäten gefunden."

    summaries = []
    for activity in activities:
        if not isinstance(activity, dict):
            continue
        name = activity.get("name")
        if not include_unnamed and (not name or name == "Unnamed"):
            continue
        summaries.append(_format_activity_summary(activity))
        if len(summaries) >= limit:
            break

    if not summaries:
        return "Keine benannten Aktivitäten gefunden. Setze include_unnamed=True, um auch unbenannte Aktivitäten zu sehen."

    return "Aktivitäten:\n" + "\n".join(summaries)


@mcp.tool()
async def get_activity_details(
    activity_id: str,
    api_key: str | None = None,
) -> str:
    """Get detailed information for a specific activity."""
    if not activity_id:
        return "activity_id ist erforderlich."

    result = await make_intervals_request(
        f"/activity/{activity_id}", api_key=api_key
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    if isinstance(result, list) and result:
        activity = result[0]
    else:
        activity = result

    if not isinstance(activity, dict):
        return "Ungültige Aktivitätsdaten erhalten."

    return _format_activity_details(activity)


@mcp.tool()
async def get_activity_intervals(
    activity_id: str,
    api_key: str | None = None,
) -> str:
    """Get interval data for a specific activity."""
    if not activity_id:
        return "activity_id ist erforderlich."

    result = await make_intervals_request(
        f"/activity/{activity_id}/intervals", api_key=api_key
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    if not result:
        return "Keine Intervalldaten gefunden."

    return f"Intervalldaten:\n{result}"
