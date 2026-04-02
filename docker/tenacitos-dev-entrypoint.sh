#!/bin/sh
set -e
mkdir -p /app/data
for f in cron-jobs activities notifications configured-skills tasks; do
  if [ ! -f "/app/data/${f}.json" ] && [ -f "/opt/tenacitos-data-examples/${f}.example.json" ]; then
    cp "/opt/tenacitos-data-examples/${f}.example.json" "/app/data/${f}.json"
  fi
done
if [ ! -x /app/node_modules/.bin/next ]; then
  echo "tenacitos dev: npm ci (volume node_modules vide ou première exécution)…"
  npm ci
fi
exec "$@"
