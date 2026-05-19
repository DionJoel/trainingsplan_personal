import json
import logging
import sys
from contextlib import asynccontextmanager
from enum import Enum
from http import HTTPStatus
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

from intervals_mcp_server.config import get_config

logger = logging.getLogger("intervals_icu_mcp_server")
httpx_client: httpx.AsyncClient | None = None


async def _get_httpx_client() -> httpx.AsyncClient:
    global httpx_client

    try:
        from intervals_mcp_server import server as server_module

        server_client = getattr(server_module, "httpx_client", None)
        if server_client is not None and not server_client.is_closed:
            return server_client
    except ImportError:
        pass

    if httpx_client is None or httpx_client.is_closed:
        httpx_client = httpx.AsyncClient()
    return httpx_client


@asynccontextmanager
async def setup_api_client(_app: FastMCP):
    try:
        yield
    finally:
        global httpx_client
        if httpx_client is not None and not httpx_client.is_closed:
            await httpx_client.aclose()
            httpx_client = None


class TransportAliases(str, Enum):
    STDIO = "stdio"
    HTTP = "http"
    SSE = "sse"
    STREAMABLE_HTTP = "streamable-http"


def _get_error_message(error_code: int, error_text: str) -> str:
    error_messages = {
        HTTPStatus.UNAUTHORIZED: f"{HTTPStatus.UNAUTHORIZED.value} {HTTPStatus.UNAUTHORIZED.phrase}: API key missing or invalid.",
        HTTPStatus.FORBIDDEN: f"{HTTPStatus.FORBIDDEN.value} {HTTPStatus.FORBIDDEN.phrase}: Access denied.",
        HTTPStatus.NOT_FOUND: f"{HTTPStatus.NOT_FOUND.value} {HTTPStatus.NOT_FOUND.phrase}: Resource not found.",
        HTTPStatus.TOO_MANY_REQUESTS: f"{HTTPStatus.TOO_MANY_REQUESTS.value} {HTTPStatus.TOO_MANY_REQUESTS.phrase}: Rate limit exceeded.",
        HTTPStatus.INTERNAL_SERVER_ERROR: f"{HTTPStatus.INTERNAL_SERVER_ERROR.value} {HTTPStatus.INTERNAL_SERVER_ERROR.phrase}: Intervals.icu server error.",
        HTTPStatus.SERVICE_UNAVAILABLE: f"{HTTPStatus.SERVICE_UNAVAILABLE.value} {HTTPStatus.SERVICE_UNAVAILABLE.phrase}: Service unavailable.",
    }
    return error_messages.get(HTTPStatus(error_code), error_text)


def _prepare_request_config(
    url: str,
    api_key: str | None,
    method: str,
) -> tuple[str, httpx.BasicAuth | None, dict[str, str], str | None]:
    config = get_config()
    headers = {"User-Agent": config.user_agent, "Accept": "application/json"}

    if method in {"POST", "PUT"}:
        headers["Content-Type"] = "application/json"

    key_to_use = api_key if api_key is not None else config.api_key
    if not key_to_use:
        return "", None, {}, "API key is required. Set API_KEY in .env or pass api_key."

    auth = httpx.BasicAuth("API_KEY", key_to_use)
    full_url = f"{config.intervals_api_base_url}{url}"
    return full_url, auth, headers, None


def _parse_response(response: httpx.Response, full_url: str) -> Any:
    try:
        if response.content:
            return response.json()
        return {}
    except json.JSONDecodeError:
        logger.error("Invalid JSON from %s", full_url)
        return {"error": True, "message": "Invalid JSON in response"}


async def make_intervals_request(
    url: str,
    api_key: str | None = None,
    params: dict[str, Any] | None = None,
    method: str = "GET",
    data: dict[str, Any] | None = None,
) -> Any:
    full_url, auth, headers, error_msg = _prepare_request_config(url, api_key, method)
    if error_msg:
        return {"error": True, "message": error_msg}

    client = await _get_httpx_client()
    request_kwargs = {
        "url": full_url,
        "headers": headers,
        "params": params,
        "auth": auth,
        "timeout": 30.0,
    }

    if method in {"POST", "PUT"} and data is not None:
        request_kwargs["json"] = data

    response = await client.request(method, **request_kwargs)
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        return {"error": True, "message": _get_error_message(exc.response.status_code, exc.response.text)}
    return _parse_response(response, full_url)
