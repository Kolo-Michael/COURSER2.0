import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def load_env_file() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        value = line.strip()
        if not value or value.startswith("#") or "=" not in value:
            continue

        key, raw = value.split("=", 1)
        os.environ.setdefault(key.strip(), raw.strip().strip('"').strip("'"))


def normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlsplit(url)
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in {"sslmode", "channel_binding"}
    ]
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


def database_requires_ssl(url: str) -> bool:
    raw_url = os.getenv("DATABASE_URL", url)
    return "sslmode=require" in raw_url or "neon.tech" in raw_url


load_env_file()


@lru_cache()
def get_settings():
    return Settings()


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DEBUG_SQL: bool = os.getenv("DEBUG_SQL", "false").lower() == "true"

    DATABASE_URL: str = normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://user:password@localhost/courser",
        )
    )
    DATABASE_CONNECT_ARGS: dict = {"ssl": True} if database_requires_ssl(DATABASE_URL) else {}


settings = get_settings()
