from intervals_mcp_server.api.client import make_intervals_request
from intervals_mcp_server.config import get_config
from intervals_mcp_server.mcp_instance import mcp


@mcp.tool()
async def get_events(
    athlete_id: str | None = None,
    api_key: str | None = None,
) -> str:
    """Get upcoming events and goals for an athlete."""
    config = get_config()
    athlete_id = athlete_id or config.athlete_id
    if not athlete_id:
        return "ATHLETE_ID is required."

    result = await make_intervals_request(
        f"/athlete/{athlete_id}/events", api_key=api_key
    )
    if isinstance(result, dict) and result.get("error"):
        return f"Error: {result.get('message')}"

    if not result:
        return "Keine Events gefunden."

    return f"Events: {result}"
