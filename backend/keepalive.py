"""Ping a backend health endpoint to keep serverless functions warm.

Vercel Hobby Functions and Render free instances can go idle and pay a
cold-start cost on the next request. A scheduled ping keeps the Python
runtime warm so real users get a fast first response.

Two modes:

  1. Single ping (default / cron):
       python keepalive.py [URL]
      Defaults to $HEALTH_URL, then https://courser-api-18uo.onrender.com/api/health

  2. Loop mode (every 15 seconds, runs forever):
       python keepalive.py --loop [URL]
       python keepalive.py --loop --interval 15 [URL]
     Useful when you don't have cron available (e.g. a dev container or
     background task on Windows).

Exit codes:
  0  health endpoint returned HTTP 200
  1  any failure (non-200, timeout, DNS, connection error)
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import urllib.error
import urllib.request

DEFAULT_URL = "https://courser-api-18uo.onrender.com/api/health"
TIMEOUT_SECONDS = 30


def ping(url: str = DEFAULT_URL) -> int:
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Keep backend endpoints warm with scheduled pings.",
    )
    parser.add_argument(
        "url",
        nargs="?",
        default=None,
        help="Health endpoint URL (overrides HEALTH_URL env).",
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Run continuously instead of a single ping.",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=15,
        help="Seconds between pings in --loop mode (default: 15).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    url = args.url or os.getenv("HEALTH_URL", DEFAULT_URL)

    if args.loop:
        print(f"Loop mode: pinging {url} every {args.interval}s")
        while True:
            ping(url)
            time.sleep(args.interval)
        return 0  # unreachable

    return ping(url)


if __name__ == "__main__":
    sys.exit(main())
