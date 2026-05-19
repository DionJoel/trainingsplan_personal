from typing import Any

from intervals_mcp_server.api.client import make_intervals_request
from intervals_mcp_server.config import get_config
from intervals_mcp_server.mcp_instance import mcp


def _format_event(event: dict[str, Any]) -> str:
    name = event.get("name") or event.get("title") or "Event"
    start_date = event.get("date") or event.get("start_date") or "unbekannt"
    return f"- {name}: {start_date}"


@mcp.tool()
async def get_events(
    athlete_id: str | None = None,
    api_key: str | None = None,
) -> str:
    """Get upcoming events for an athlete."""
    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."

    result = await make_intervals_request(
        f"/athlete/{athlete_id}/events", api_key=api_key
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    events = result if isinstance(result, list) else [result]
    if not events:
        return "Keine Events gefunden."

    return "Events:\n" + "\n".join(
        _format_event(event) for event in events if isinstance(event, dict)
    )


@mcp.tool()
async def get_event_by_id(
    event_id: str,
    athlete_id: str | None = None,
    api_key: str | None = None,
) -> str:
    """Get details for a specific event."""
    if not event_id:
        return "event_id ist erforderlich."

    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."

    result = await make_intervals_request(
        f"/athlete/{athlete_id}/events/{event_id}", api_key=api_key
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    if not isinstance(result, dict):
        return "Ungültige Event-Daten erhalten."

    return _format_event(result)


@mcp.tool()
async def add_or_update_event(
    event_id: str | None = None,
    athlete_id: str | None = None,
    api_key: str | None = None,
    event_data: dict[str, Any] | None = None,
) -> str:
    """Create or update an event in Intervals.icu."""
    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."
    if not event_data:
        return "event_data is required."

    if event_id:
        result = await make_intervals_request(
            f"/athlete/{athlete_id}/events/{event_id}",
            api_key=api_key,
            method="PUT",
            data=event_data,
        )
    else:
        result = await make_intervals_request(
            f"/athlete/{athlete_id}/events",
            api_key=api_key,
            method="POST",
            data=event_data,
        )

    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    return f"Event gespeichert: {result}"
