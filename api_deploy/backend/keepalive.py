"""Ping the production API to keep the Vercel Function warm.

Vercel Hobby Functions can go idle and pay a cold-start cost on the next
request. A scheduled ping keeps the Python runtime warm so real users get
a fast first response. An external scheduler (UptimeRobot, cron-job.org,
GitHub Actions schedule, a local cron, ...) can hit the endpoint directly —
no script needed. This small stdlib-only script exists for schedulers that
run commands instead of HTTP checks (cron-job.org CLI mode, `cron`, CI
schedules, ...).

Exit codes:
  0  health endpoint returned HTTP 200
  1  any failure (non-200, timeout, DNS, connection error)

Usage:
  python keepalive.py [URL]

Defaults to $HEALTH_URL, then https://courser2.vercel.app/api/health.
Set HEALTH_URL in the environment or pass it as the first argument.
"""

from __future__ import annotations

import os
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "https://courser2.vercel.app/api/health"
TIMEOUT_SECONDS = 30


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("HEALTH_URL", DEFAULT_URL)
    print(f"Pinging {url}")
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as resp:
            status = resp.status
            body = resp.read(200).decode("utf-8", errors="replace").strip()
    except (urllib.error.URLError, OSError, ValueError) as exc:
        print(f"FAILED: {exc}")
        return 1

    if status != 200:
        print(f"FAILED: HTTP {status} {body}")
        return 1

    print(f"OK: HTTP {status} {body}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
