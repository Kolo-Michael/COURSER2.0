import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _load_env_file(path: Path, override: bool = False) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        value = line.strip()
        if not value or value.startswith("#") or "=" not in value:
            continue
        key, raw = value.split("=", 1)
        clean = raw.strip().strip('"').strip("'")
        if override:
            os.environ[key.strip()] = clean
        else:
            os.environ.setdefault(key.strip(), clean)


def load_env_file() -> None:
    """Load .env first, then .env.local (which takes priority)."""
    base = Path(__file__).resolve().parents[2]
    _load_env_file(base / ".env", override=False)
    _load_env_file(base / ".env.local", override=True)


def normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # SQLite URLs (sqlite+aiosqlite:///<path> or sqlite+aiosqlite:///<abs>)
    # have no host. urlsplit treats the third slash as the start of the
    # path; urlunsplit then collapses back to only one slash, which
    # SQLAlchemy rejects. Pass the URL through untouched.
    if url.startswith("sqlite"):
        return url

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
    # Short-lived access token. Frontend reads nothing from it; the backend
    # uses it to authorize mutating endpoints. 60 min is the sweet spot
    # between forcing reloads and reducing exposure window.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Refresh token lives longer; rotated on use.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # "Remember me" refresh-token lifetime (mobile). When the user opts in,
    # the refresh token (and its DB session) lasts this long, so they don't
    # have to re-authenticate for up to 30 days.
    REMEMBER_ME_EXPIRE_DAYS: int = 30
    # Bcrypt cost factor. 12 ≈ 250ms on a modern CPU — slow enough to
    # make brute force expensive, fast enough not to sign-up-spam users.
    BCRYPT_ROUNDS: int = int(os.getenv("BCRYPT_ROUNDS", "12"))
    # After this many consecutive failed logins the account is locked.
    MAX_FAILED_LOGINS: int = 5
    # Lockout window before the counter resets.
    LOCKOUT_DURATION_MINUTES: int = 15
    # Streak system: how many skipped days can be restored per calendar month.
    MAX_STREAK_RESTORES_PER_MONTH: int = int(os.getenv("MAX_STREAK_RESTORES_PER_MONTH", "4"))
    # Refresh-token sessions older than this (no refresh / no activity) are
    # considered dead — the auth becomes inactivity-based on top of the fixed
    # expiry. Default 3 days; the mobile client additionally enforces a much
    # shorter idle timeout locally.
    INACTIVITY_TIMEOUT_MINUTES: int = int(os.getenv("INACTIVITY_TIMEOUT_MINUTES", "4320"))
    DEBUG_SQL: bool = os.getenv("DEBUG_SQL", "false").lower() == "true"

    DATABASE_URL: str = normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://user:password@localhost/courser",
        )
    )
    # Neon's pooler endpoint takes a few seconds for the cold-start TLS
    # handshake; asyncpg's default `timeout` of 60s is what we want so the
    # first request after a fresh worker boot doesn't race the connection
    # setup. The `ssl: True` is required for Neon — config above sets it
    # based on the URL contents (sslmode=require or "neon.tech" in the host).
    DATABASE_CONNECT_ARGS: dict = (
        {"ssl": True, "timeout": 60} if database_requires_ssl(DATABASE_URL) else {"timeout": 60}
    )


settings = get_settings()
