#!/bin/sh
set -eu

HOURS="${CRON_SCHEDULE_HOURS:-6}"
SLEEP_SECONDS=$((HOURS * 3600))

echo "[cron] auto-generate every ${HOURS}h, target: http://app:3000/api/cron/generate-article"

# Wait for the app to be reachable before the first run (compose
# depends_on/healthcheck only gates container start order, not "is Next.js
# actually serving requests yet").
until wget -q -O /dev/null "http://app:3000/login"; do
  echo "[cron] waiting for app..."
  sleep 5
done

while true; do
  echo "[cron] triggering auto-generate at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  wget -q -O - \
    --header="x-cron-secret: ${CRON_SECRET}" \
    --post-data="" \
    "http://app:3000/api/cron/generate-article" \
    || echo "[cron] request failed (non-fatal, will retry next cycle)"
  echo ""
  sleep "$SLEEP_SECONDS"
done
