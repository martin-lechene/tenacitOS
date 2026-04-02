#!/bin/sh
# À lancer sur la machine hôte (répertoire du repo), si l’API HTTP WhatsApp échoue.
# Prérequis : DISCORD_WEBHOOK_URL et docker compose avec service openclaw.
#
#   export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/ID/TOKEN'
#   export NOTIFY_WHATSAPP_E164='+32496881898'
#   sh docker/notify-hello-host.sh "Hello world"

set -e
MSG="${1:-Hello world from TenacitOS}"
ENV_FILE="${ENV_FILE:-docker/.env}"

if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
  curl -sS -X POST -H "Content-Type: application/json" \
    -d "{\"content\":\"$MSG\"}" "$DISCORD_WEBHOOK_URL" || true
  echo ""
fi

TO="${NOTIFY_WHATSAPP_E164:-+32496881898}"
docker compose --env-file "$ENV_FILE" exec -T openclaw \
  openclaw agent --to "$TO" --message "$MSG" --deliver
