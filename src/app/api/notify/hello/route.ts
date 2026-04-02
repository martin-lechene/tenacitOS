import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { OPENCLAW_CONFIG } from "@/lib/paths";

export const dynamic = "force-dynamic";

function gatewayBase(): string {
  return (
    process.env.OPENCLAW_GATEWAY_URL?.trim() || "http://127.0.0.1:18789"
  ).replace(/\/$/, "");
}

function resolveGatewayToken(): string | undefined {
  const env = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  if (env) return env;
  try {
    const c = JSON.parse(readFileSync(OPENCLAW_CONFIG, "utf8")) as {
      gateway?: { auth?: { token?: string } } };
    const t = c.gateway?.auth?.token;
    return typeof t === "string" && t.length > 0 ? t : undefined;
  } catch {
    return undefined;
  }
}

type InvokeResult = { ok: boolean; status: number; detail?: unknown };

async function tryWhatsAppViaToolsInvoke(
  base: string,
  token: string,
  to: string,
  message: string,
): Promise<InvokeResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-openclaw-message-channel": "whatsapp",
  };

  const attempts: Record<string, unknown>[] = [
    { tool: "agent", sessionKey: "main", args: { message, to, deliver: true } },
    {
      tool: "agent",
      sessionKey: "main",
      args: { message, deliver: true, replyTo: to, replyChannel: "whatsapp" },
    },
  ];

  let last: InvokeResult = { ok: false, status: 0 };
  for (const body of attempts) {
    const res = await fetch(`${base}/tools/invoke`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    const detail = await res.json().catch(() => ({}));
    const ok = res.ok && (detail as { ok?: boolean }).ok === true;
    last = { ok, status: res.status, detail };
    if (ok) return last;
  }
  return last;
}

/**
 * POST /api/notify/hello
 * Envoie un message de test vers Discord (webhook) et tente WhatsApp via OpenClaw gateway.
 *
 * Body optionnel : { "message": "...", "whatsappTo": "+32..." }
 *
 * Env :
 * - DISCORD_WEBHOOK_URL (ne jamais committer l’URL complète)
 * - NOTIFY_WHATSAPP_E164 (défaut +32496881898 si non défini)
 * - OPENCLAW_GATEWAY_URL, OPENCLAW_GATEWAY_TOKEN
 */
export async function POST(request: Request) {
  let body: { message?: string; whatsappTo?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* empty body */
  }

  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "Hello world from TenacitOS";

  const whatsappTo =
    typeof body.whatsappTo === "string" && body.whatsappTo.trim()
      ? body.whatsappTo.trim()
      : process.env.NOTIFY_WHATSAPP_E164?.trim() || "+32496881898";

  const results: {
    discord: { ok: boolean; status?: number; error?: string };
    whatsapp: {
      ok: boolean;
      status?: number;
      error?: string;
      hint?: string;
      detail?: unknown;
    };
  } = {
    discord: { ok: false },
    whatsapp: { ok: false },
  };

  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) {
    results.discord = { ok: false, error: "DISCORD_WEBHOOK_URL is not set" };
  } else {
    try {
      const dr = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
        signal: AbortSignal.timeout(15_000),
      });
      results.discord = { ok: dr.ok, status: dr.status };
      if (!dr.ok) {
        results.discord.error = `HTTP ${dr.status}`;
      }
    } catch (e) {
      results.discord = {
        ok: false,
        error: e instanceof Error ? e.message : "Discord request failed",
      };
    }
  }

  const token = resolveGatewayToken();
  const base = gatewayBase();
  if (!token) {
    results.whatsapp = {
      ok: false,
      error: "Gateway token missing (OPENCLAW_GATEWAY_TOKEN or openclaw.json)",
      hint:
        'Host fallback: docker compose --env-file docker/.env exec openclaw openclaw agent --to "' +
        whatsappTo +
        '" --message "' +
        message.replace(/"/g, '\\"') +
        '" --deliver',
    };
  } else {
    try {
      const inv = await tryWhatsAppViaToolsInvoke(base, token, whatsappTo, message);
      results.whatsapp = {
        ok: inv.ok,
        status: inv.status,
        detail: inv.detail,
      };
      if (!inv.ok) {
        results.whatsapp.hint =
          'If /tools/invoke is blocked or tool name differs, run on the host: docker compose --env-file docker/.env exec openclaw openclaw agent --to "' +
          whatsappTo +
          '" --message "' +
          message.replace(/"/g, '\\"') +
          '" --deliver';
      }
    } catch (e) {
      results.whatsapp = {
        ok: false,
        error: e instanceof Error ? e.message : "WhatsApp gateway request failed",
        hint:
          'docker compose --env-file docker/.env exec openclaw openclaw agent --to "' +
          whatsappTo +
          '" --message "' +
          message.replace(/"/g, '\\"') +
          '" --deliver',
      };
    }
  }

  const ok = results.discord.ok && results.whatsapp.ok;
  const partial = results.discord.ok || results.whatsapp.ok;
  const bothFailed = !results.discord.ok && !results.whatsapp.ok;

  return NextResponse.json(
    {
      ok,
      partial,
      message,
      whatsappTo,
      results,
    },
    { status: bothFailed ? 502 : 200 },
  );
}
