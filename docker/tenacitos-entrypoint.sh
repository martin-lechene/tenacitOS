#!/bin/sh
set -e
mkdir -p /app/data
for f in cron-jobs activities notifications configured-skills tasks; do
  if [ ! -f "/app/data/${f}.json" ] && [ -f "/opt/tenacitos-data-examples/${f}.example.json" ]; then
    cp "/opt/tenacitos-data-examples/${f}.example.json" "/app/data/${f}.json"
  fi
done
exec "$@"
