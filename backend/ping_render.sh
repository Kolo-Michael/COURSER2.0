#!/usr/bin/env bash
# Ping the Render endpoint every 15 seconds (4x per run).
# Cron's minimum granularity is 1 minute, so this script runs 4 hits
# spaced 15 seconds apart — schedule it * * * * * in crontab.
#
# Set RENDER_HEALTH_URL to override the default endpoint.
#
# Exit codes:
#   0  all 4 pings succeeded
#   1  at least one ping failed (but the loop still completes)

set -euo pipefail

URL="${RENDER_HEALTH_URL:-https://courser-api-18uo.onrender.com/api/health}"
TIMEOUT=10

# Allow overriding the interval for testing (default: 15s)
INTERVAL="${PING_INTERVAL:-15}"

echo "[$(date -u +%FT%TZ)] Starting 4x ping loop for ${URL} (interval=${INTERVAL}s)"

failures=0

for i in 1 2 3 4; do
  echo "[$(date -u +%FT%TZ)] Ping #${i}/4 -> ${URL}"
  if curl --max-time "$TIMEOUT" --silent --show-error --output /dev/null --write "HTTP %{http_code}" "${URL}"; then
    echo " OK"
  else
    echo " FAILED"
    failures=$((failures + 1))
  fi

  # Don't sleep after the last iteration
  if [ "$i" -lt 4 ]; then
    sleep "$INTERVAL"
  fi
done

echo "[$(date -u +%FT%TZ)] Done. Failures: ${failures}/4"

if [ "$failures" -gt 0 ]; then
  exit 1
fi
exit 0