import re

ATHLETE_ID_PATTERN = re.compile(r"^i[0-9]+$")


def validate_athlete_id(athlete_id: str) -> None:
    if not ATHLETE_ID_PATTERN.match(athlete_id):
        raise ValueError(f"Ungültiges ATHLETE_ID-Format: {athlete_id}")
