#!/usr/bin/env node
/**
 * Applies OPENCLAW_MODEL_PRIMARY (compose default: ollama/llama3.2:3b).
 * Fixes legacy anthropic/claude-sonnet-4 → sonnet-4-5 when no override is set.
 */
const fs = require("fs");
const path = require("path");

const LEGACY = "anthropic/claude-sonnet-4";
/** If still on legacy Anthropic id and OPENCLAW_MODEL_PRIMARY unset, fix catalog id. */
const DEFAULT_FIX = "anthropic/claude-sonnet-4-5";
const override = (process.env.OPENCLAW_MODEL_PRIMARY || "").trim();

const dir = process.env.OPENCLAW_DIR || "/root/.openclaw";
const p = path.join(dir, "openclaw.json");
if (!fs.existsSync(p)) process.exit(0);

let j;
try {
  j = JSON.parse(fs.readFileSync(p, "utf8"));
} catch {
  process.exit(0);
}

if (!j.agents || typeof j.agents !== "object" || Array.isArray(j.agents)) j.agents = {};
if (!j.agents.defaults || typeof j.agents.defaults !== "object") j.agents.defaults = {};
if (!j.agents.defaults.model || typeof j.agents.defaults.model !== "object") {
  j.agents.defaults.model = {};
}

const primary = j.agents.defaults.model.primary;
if (override) {
  j.agents.defaults.model.primary = override;
} else if (primary === LEGACY) {
  j.agents.defaults.model.primary = DEFAULT_FIX;
}

if (Array.isArray(j.agents.list)) {
  for (const a of j.agents.list) {
    if (!a || typeof a !== "object") continue;
    const m = a.model;
    if (m && typeof m === "object" && m.primary === LEGACY) {
      m.primary = override || DEFAULT_FIX;
    }
  }
}

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
