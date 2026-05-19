import os
from dataclasses import dataclass

from intervals_mcp_server.utils.validation import validate_athlete_id

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


@dataclass
class Config:
    api_key: str
    athlete_id: str
    intervals_api_base_url: str
    user_agent: str


_config_instance: Config | None = None


def load_config() -> Config:
    api_key = os.getenv("API_KEY", "")
    athlete_id = os.getenv("ATHLETE_ID", "")
    intervals_api_base_url = os.getenv(
        "INTERVALS_API_BASE_URL", "https://intervals.icu/api/v1"
    )
    user_agent = os.getenv("USER_AGENT", "trainingsplan_personal_mcp/0.1.0")

    if athlete_id:
        validate_athlete_id(athlete_id)

    return Config(
        api_key=api_key,
        athlete_id=athlete_id,
        intervals_api_base_url=intervals_api_base_url,
        user_agent=user_agent,
    )


def get_config() -> Config:
    global _config_instance
    if _config_instance is None:
        _config_instance = load_config()
    return _config_instance
