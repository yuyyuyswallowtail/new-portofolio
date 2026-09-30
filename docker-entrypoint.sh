#!/bin/sh
set -e

echo "[entrypoint] running migrations..."
bunx --bun drizzle-kit migrate || echo "[entrypoint] migrate skipped/failed (check drizzle folder + DATABASE_URL)"

echo "[entrypoint] starting app..."
exec "$@"
