#!/usr/bin/env node
/**
 * If OPENCLAW_GATEWAY_TOKEN is set, writes it to openclaw.json gateway.auth.token
 * so the gateway and CLI use the same secret (avoids "gateway token mismatch").
 */
const fs = require("fs");
const path = require("path");

const token = (process.env.OPENCLAW_GATEWAY_TOKEN || "").trim();
if (!token) process.exit(0);

const dir = process.env.OPENCLAW_DIR || "/root/.openclaw";
const p = path.join(dir, "openclaw.json");
if (!fs.existsSync(p)) process.exit(0);

let j;
try {
  j = JSON.parse(fs.readFileSync(p, "utf8"));
} catch {
  process.exit(0);
}

if (!j.gateway || typeof j.gateway !== "object" || Array.isArray(j.gateway)) {
  j.gateway = {};
}
if (!j.gateway.auth || typeof j.gateway.auth !== "object" || Array.isArray(j.gateway.auth)) {
  j.gateway.auth = {};
}
j.gateway.auth.token = token;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
