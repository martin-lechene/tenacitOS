import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

import {
  OPENCLAW_CONFIG,
  OPENCLAW_DIR,
  OPENCLAW_WORKSPACE,
  WORKSPACE_IDENTITY,
} from '@/lib/paths';

const WORKSPACE_PATH = OPENCLAW_WORKSPACE;
const IDENTITY_PATH = WORKSPACE_IDENTITY;
const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

function parseIdentityMd(): { name: string; creature: string; emoji: string } {
  try {
    const content = fs.readFileSync(IDENTITY_PATH, 'utf-8');
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
    const creatureMatch = content.match(/\*\*Creature:\*\*\s*(.+)/);
    const emojiMatch = content.match(/\*\*Emoji:\*\*\s*(.+)/);
    
    return {
      name: nameMatch?.[1]?.trim() || 'Unknown',
      creature: creatureMatch?.[1]?.trim() || 'AI Agent',
      emoji: emojiMatch?.[1]?.match(/./u)?.[0] || '🤖',
    };
  } catch {
    return { name: 'OpenClaw Agent', creature: 'AI Agent', emoji: '🤖' };
  }
}

function getIntegrationStatus() {
  const integrations = [];

  // Telegram — read from openclaw.json (channels.telegram)
  let telegramEnabled = false;
  let telegramAccounts = 0;
  try {
    const openclawConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
    const telegramConfig = openclawConfig?.channels?.telegram;
    telegramEnabled = !!(telegramConfig?.enabled);
    if (telegramConfig?.accounts) {
      telegramAccounts = Object.keys(telegramConfig.accounts).length;
    }
  } catch {}
  integrations.push({
    id: 'telegram',
    name: 'Telegram',
    status: telegramEnabled ? 'connected' : 'disconnected',
    icon: 'MessageCircle',
    lastActivity: telegramEnabled ? new Date().toISOString() : null,
    detail: telegramEnabled ? `${telegramAccounts} bots configured` : null,
  });

  // WhatsApp — read from openclaw.json (channels.whatsapp) + coarse session hint
  let whatsappEnabled = false;
  let whatsappLinked = false;
  try {
    const openclawConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
    const wa = openclawConfig?.channels?.whatsapp;
    whatsappEnabled = !!(wa && typeof wa === 'object' && wa.enabled === true);
    if (wa?.linked === true || wa?.status === 'linked') whatsappLinked = true;
    const credRoot = path.join(OPENCLAW_DIR, 'credentials');
    if (fs.existsSync(credRoot)) {
      const subs = fs.readdirSync(credRoot, { withFileTypes: true });
      whatsappLinked =
        whatsappLinked ||
        subs.some(
          (d) =>
            d.isDirectory() &&
            /whatsapp|baileys|wwebjs|webjs/i.test(d.name)
        );
    }
  } catch {}
  let whatsappStatus: 'connected' | 'configured' | 'not_configured';
  let whatsappDetail: string | null = null;
  if (!whatsappEnabled) {
    whatsappStatus = 'not_configured';
  } else if (whatsappLinked) {
    whatsappStatus = 'connected';
  } else {
    whatsappStatus = 'configured';
    whatsappDetail = 'Channel enabled — finish QR / pairing in OpenClaw if needed';
  }
  integrations.push({
    id: 'whatsapp',
    name: 'WhatsApp',
    status: whatsappStatus,
    icon: 'Smartphone',
    lastActivity: whatsappLinked ? new Date().toISOString() : null,
    detail: whatsappDetail,
  });

  // Twitter (bird CLI) - check TOOLS.md for configuration
  let twitterConfigured = false;
  try {
    const toolsPath = path.join(WORKSPACE_PATH, 'TOOLS.md');
    const toolsContent = fs.readFileSync(toolsPath, 'utf-8');
    twitterConfigured = toolsContent.includes('bird') && toolsContent.includes('auth_token');
  } catch {}
  integrations.push({
    id: 'twitter',
    name: 'Twitter (bird CLI)',
    status: twitterConfigured ? 'configured' : 'not_configured',
    icon: 'Twitter',
    lastActivity: null,
    detail: null,
  });

  // Google (gog/google-gemini-cli-auth) — check openclaw.json plugins
  let googleConfigured = false;
  let googleDetail: string | null = null;
  try {
    const openclawConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
    const gogPlugin = openclawConfig?.plugins?.entries?.['google-gemini-cli-auth'];
    googleConfigured = !!(gogPlugin?.enabled);
    if (googleConfigured) googleDetail = 'google-gemini-cli-auth plugin enabled';
  } catch {}
  // Fallback: check for gog config directory
  if (!googleConfigured) {
    try {
      const gogPath = path.join(os.homedir(), '.config', 'gog');
      googleConfigured = fs.existsSync(gogPath);
    } catch {}
  }
  integrations.push({
    id: 'google',
    name: 'Google (GOG)',
    status: googleConfigured ? 'configured' : 'not_configured',
    icon: 'Mail',
    lastActivity: null,
    detail: googleDetail,
  });

  return integrations;
}

export async function GET() {
  const identity = parseIdentityMd();
  const uptime = process.uptime();
  const nodeVersion = process.version;
  const model =
    process.env.OPENCLAW_MODEL ||
    process.env.DEFAULT_MODEL ||
    "ollama/llama3.2:3b";
  
  const systemInfo = {
    agent: {
      name: identity.name,
      creature: identity.creature,
      emoji: identity.emoji,
    },
    system: {
      uptime: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      nodeVersion,
      model,
      workspacePath: WORKSPACE_PATH,
      platform: os.platform(),
      hostname: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
    },
    integrations: getIntegrationStatus(),
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(systemInfo);
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();
    
    if (action === 'change_password') {
      const { currentPassword, newPassword } = data;
      
      // Read current .env.local
      let envContent = '';
      try {
        envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8');
      } catch {
        return NextResponse.json({ error: 'Could not read configuration' }, { status: 500 });
      }
      
      // Verify current password
      const currentPassMatch = envContent.match(/AUTH_PASSWORD=(.+)/);
      const storedPassword = currentPassMatch?.[1]?.trim();
      
      if (storedPassword !== currentPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      
      // Update password
      const newEnvContent = envContent.replace(
        /AUTH_PASSWORD=.*/,
        `AUTH_PASSWORD=${newPassword}`
      );
      
      fs.writeFileSync(ENV_LOCAL_PATH, newEnvContent);
      
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }
    
    if (action === 'clear_activity_log') {
      const activitiesPath = path.join(process.cwd(), 'data', 'activities.json');
      fs.writeFileSync(activitiesPath, '[]');
      return NextResponse.json({ success: true, message: 'Activity log cleared' });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);
  
  return parts.join(' ');
}
