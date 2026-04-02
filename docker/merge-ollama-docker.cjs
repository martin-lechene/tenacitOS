#!/usr/bin/env node
/**
 * Registers Ollama as explicit provider for Docker: gateway must reach the host
 * (host.docker.internal on Windows/macOS Docker Desktop). Native API only — no /v1
 * (see https://docs.openclaw.ai/providers/ollama).
 *
 * Default model: llama3.2:3b (léger, ~2 Go RAM — voir ollama.com/library).
 * Plus petit encore : llama3.2:1b, qwen2.5:0.5b. Plus costaud : glm-4.7-flash, gpt-oss:20b.
 */
const fs = require("fs");
const path = require("path");

const dir = process.env.OPENCLAW_DIR || "/root/.openclaw";
const p = path.join(dir, "openclaw.json");
if (!fs.existsSync(p)) process.exit(0);

let j;
try {
  j = JSON.parse(fs.readFileSync(p, "utf8"));
} catch {
  process.exit(0);
}

const rawBase =
  process.env.OPENCLAW_OLLAMA_BASE_URL?.trim() ||
  "http://host.docker.internal:11434";
let baseUrl = rawBase.replace(/\/$/, "");
baseUrl = baseUrl.replace(/\/v1$/i, "");

const modelId = process.env.OPENCLAW_OLLAMA_MODEL_ID?.trim() || "glm-4.7-flash";
const apiKey = process.env.OLLAMA_API_KEY?.trim() || "ollama-local";

if (!j.models || typeof j.models !== "object" || Array.isArray(j.models)) {
  j.models = {};
}
if (!j.models.providers || typeof j.models.providers !== "object") {
  j.models.providers = {};
}
if (!j.models.mode) j.models.mode = "merge";

j.models.providers.ollama = {
  baseUrl,
  apiKey,
  api: "ollama",
  models: [
    {
      id: modelId,
      name: `Ollama ${modelId}`,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: Number(process.env.OPENCLAW_OLLAMA_CONTEXT_WINDOW || 8192) || 8192,
      maxTokens: Number(process.env.OPENCLAW_OLLAMA_MAX_TOKENS || 4096) || 4096,
    },
  ],
};

if (!j.agents?.defaults || typeof j.agents.defaults !== "object") {
  if (!j.agents) j.agents = {};
  j.agents.defaults = {};
}
if (!j.agents.defaults.models || typeof j.agents.defaults.models !== "object") {
  j.agents.defaults.models = {};
}
const fullId = `ollama/${modelId}`;
j.agents.defaults.models[fullId] = {
  ...(j.agents.defaults.models[fullId] || {}),
  alias: "Local (Ollama)",
};

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
