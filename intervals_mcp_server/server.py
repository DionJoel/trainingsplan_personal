import logging

from intervals_mcp_server.config import get_config
from intervals_mcp_server.mcp_instance import mcp
from intervals_mcp_server.tools import activities, events, wellness

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)

config = get_config()

if __name__ == "__main__":
    if not config.athlete_id:
        raise SystemExit("ATHLETE_ID is required in environment variables.")
    if not config.api_key:
        raise SystemExit("API_KEY is required in environment variables.")

    logging.getLogger("intervals_icu_mcp_server").info("Starting MCP server...")
    mcp.run()
