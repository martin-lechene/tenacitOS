#!/bin/sh
set -e
OC_DIR="${OPENCLAW_DIR:-/root/.openclaw}"
export HOME="${HOME:-/root}"
mkdir -p "${OC_DIR}/workspace/mission-control" "${OC_DIR}/workspace/memory"
mkdir -p "${OC_DIR}/agents/main/sessions"
if [ ! -f "${OC_DIR}/openclaw.json" ]; then
  cp /opt/bootstrap/openclaw.json "${OC_DIR}/openclaw.json"
fi
if [ ! -f "${OC_DIR}/workspace/IDENTITY.md" ]; then
  cp /opt/bootstrap/IDENTITY.md "${OC_DIR}/workspace/IDENTITY.md"
fi
# Apply config migrations (legacy keys, control UI origins, etc.)
openclaw doctor --fix 2>/dev/null || true

# Keep gateway.auth.token in sync with OPENCLAW_GATEWAY_TOKEN when set (CLI reads JSON).
node /opt/sync-gateway-token.cjs

# Bundled channel plugins (e.g. WhatsApp) need channels.whatsapp.enabled in openclaw.json.
node /opt/merge-whatsapp-channel.cjs

# Ollama on host (open weights, $0) — explicit provider so Docker reaches host.docker.internal.
node /opt/merge-ollama-docker.cjs

# Apply OPENCLAW_MODEL_PRIMARY (default ollama/…) or fix legacy anthropic/claude-sonnet-4.
node /opt/sync-agent-model.cjs

exec openclaw gateway run \
  --port "${OPENCLAW_GATEWAY_PORT:-18789}" \
  --bind lan \
  --allow-unconfigured \
  --verbose
