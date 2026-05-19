from mcp.server.fastmcp import FastMCP

from intervals_mcp_server.api.client import setup_api_client

mcp = FastMCP("intervals-icu", lifespan=setup_api_client)
