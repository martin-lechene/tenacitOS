#!/usr/bin/env node
/**
 * Ensures channels.whatsapp.enabled so bundled WhatsApp plugin loads (OpenClaw 2026.x).
 * Merges allowFrom / groupAllowFrom: strips denylist digits, adds allowed senders (JIDs).
 */
const fs = require("fs");
const path = require("path");

const dir = process.env.OPENCLAW_DIR || "/root/.openclaw";
const p = path.join(dir, "openclaw.json");

/** E.164-ish digits only */
function digits(s) {
  return String(s || "").replace(/\D/g, "");
}

function parseCsv(envVal, fallback) {
  const raw = envVal && String(envVal).trim() ? String(envVal) : fallback;
  return raw
    .split(/[,\s]+/)
    .map((x) => digits(x))
    .filter(Boolean);
}

const ALLOW_DIGITS = parseCsv(
  process.env.OPENCLAW_WHATSAPP_ALLOW_FROM,
  "32496881898"
);
const DENY_DIGITS = parseCsv(
  process.env.OPENCLAW_WHATSAPP_DENYLIST,
  "32471103654"
);

function isDenied(entry) {
  const d = digits(entry);
  if (!d) return false;
  return DENY_DIGITS.includes(d);
}

function filterList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((e) => !isDenied(e));
}

function ensureJids(list) {
  const out = [...list];
  const seen = new Set(out.map((e) => digits(e)));
  for (const num of ALLOW_DIGITS) {
    if (seen.has(num)) continue;
    const jid = `${num}@s.whatsapp.net`;
    out.push(jid);
    seen.add(num);
  }
  return out;
}

function mergeAllowLists(wa) {
  const allowFrom = ensureJids(filterList(wa?.allowFrom));
  const groupAllowFrom = ensureJids(filterList(wa?.groupAllowFrom));
  return { allowFrom, groupAllowFrom };
}

if (!fs.existsSync(p)) process.exit(0);

let j;
try {
  j = JSON.parse(fs.readFileSync(p, "utf8"));
} catch {
  process.exit(0);
}

if (!j.channels || typeof j.channels !== "object" || Array.isArray(j.channels)) {
  j.channels = {};
}

const wa = j.channels.whatsapp;
const { allowFrom, groupAllowFrom } = mergeAllowLists(
  wa && typeof wa === "object" && !Array.isArray(wa) ? wa : {}
);

if (wa && typeof wa === "object" && !Array.isArray(wa)) {
  j.channels.whatsapp = {
    ...wa,
    enabled: true,
    dmPolicy: wa.dmPolicy || "pairing",
    allowFrom,
    groupAllowFrom,
  };
} else {
  j.channels.whatsapp = {
    enabled: true,
    dmPolicy: "pairing",
    allowFrom,
    groupAllowFrom,
  };
}

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
