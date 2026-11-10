/**
 * Servidor Puente WhatsApp QR para Eco Aventura (rentflow-pwa)
 * -------------------------------------------------------------
 * Permite vincular tu propio número de WhatsApp escaneando un código QR
 * (sin pagar por mensaje a Meta) y enviar automáticamente la secuencia de
 * los ~12 mensajes de Rafting (textos, links de Maps, 5 fotos del camino/poste y vCard).
 *
 * Funciona de dos formas en simultáneo:
 * 1) HTTP Directo (http://localhost:3100)
 * 2) Nube Multi-Dispositivo vía Supabase Realtime (para celulares con 4G en Vercel)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3100);
const AUTH_DIR = path.join(__dirname, '.baileys_auth');

// Load .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = (match[2] || '').replace(/^['"]|['"]$/g, '');
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let sock = null;
let qrDataUrl = null;
let whatsappReady = false;
let whatsappNumber = '';
let whatsappName = '';
let statusText = 'Iniciando motor de WhatsApp QR...';
let realtimeChannel = null;

async function ensureDependencies() {
  try {
    const baileys = await import('@whiskeysockets/baileys');
    const qrcode = await import('qrcode');
    return { baileys, qrcode: qrcode.default || qrcode };
  } catch {
    console.log('\n📦 Instalando motor liviano de WhatsApp QR (@whiskeysockets/baileys + qrcode)...');
    const { execSync } = await import('node:child_process');
    execSync('npm install --no-save @whiskeysockets/baileys qrcode pino', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
    const baileys = await import('@whiskeysockets/baileys');
    const qrcode = await import('qrcode');
    return { baileys, qrcode: qrcode.default || qrcode };
  }
}

function getStatusPayload() {
  return {
    connected: true,
    whatsappReady,
    whatsappNumber,
    whatsappName,
    qrDataUrl,
    statusText,
    timestamp: Date.now(),
  };
}

function broadcastStatusToSupabase() {
  if (!realtimeChannel) return;
  realtimeChannel.send({
    type: 'broadcast',
    event: 'bridge_status',
    payload: getStatusPayload(),
  });
}

async function sendSingleStep(phoneDigits, step) {
  if (!sock || !whatsappReady) {
    throw new Error('WhatsApp QR todavía no está vinculado.');
  }

  const jid = `${phoneDigits.replace(/\D/g, '')}@s.whatsapp.net`;

  if (step.type === 'text') {
    await sock.sendMessage(jid, { text: step.text || '' });
  } else if (step.type === 'image') {
    let buffer;
    if (step.imageBase64) {
      buffer = Buffer.from(step.imageBase64, 'base64');
    } else if (step.imageUrl && step.imageUrl.startsWith('/')) {
      const localFile = path.join(__dirname, '..', 'public', step.imageUrl);
      buffer = fs.readFileSync(localFile);
    } else {
      throw new Error('Imagen no disponible para enviar.');
    }

    await sock.sendMessage(jid, {
      image: buffer,
      caption: step.text || undefined,
    });
  } else if (step.type === 'contact') {
    if (step.text) {
      await sock.sendMessage(jid, { text: step.text });
    }
    const contactName = step.contactName || 'Pomelos Tour Rafting';
    const rawContactPhone = step.contactPhone || '+54 9 2944 317922';
    const cleanPhone = rawContactPhone.replace(/\D/g, '');
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contactName}`,
      `ORG:${step.contactOrg || 'Pomelos Tour SMA'};`,
      `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:${rawContactPhone}`,
      'END:VCARD',
    ].join('\n');

    await sock.sendMessage(jid, {
      contacts: {
        displayName: contactName,
        contacts: [{ vcard }],
      },
    });
  }
}

async function startWhatsappSocket() {
  const { baileys, qrcode } = await ensureDependencies();
  const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
  const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
  const pino = (await import('pino')).default;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Eco Aventura Rafting', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      whatsappReady = false;
      qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, width: 320 });
      statusText = 'Escaneá el código QR desde la pestaña WhatsApp QR en Eco Aventura';
      console.log('📱 Nuevo código QR generado. Abrí Eco Aventura > Info Rafting > WhatsApp QR para escanearlo.');
      broadcastStatusToSupabase();
    }

    if (connection === 'open') {
      whatsappReady = true;
      qrDataUrl = null;
      whatsappNumber = (sock.user?.id || '').split(':')[0];
      whatsappName = sock.user?.name || 'Eco Aventura';
      statusText = `WhatsApp Conectado (+${whatsappNumber})`;
      console.log(`✅ WhatsApp vinculado con éxito: +${whatsappNumber} (${whatsappName})`);
      broadcastStatusToSupabase();
    }

    if (connection === 'close') {
      whatsappReady = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      statusText = shouldReconnect ? 'Reconectando con WhatsApp...' : 'Sesión cerrada. Escaneá el nuevo QR.';
      broadcastStatusToSupabase();

      if (!shouldReconnect) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
      setTimeout(() => startWhatsappSocket(), 2500);
    }
  });
}

function initSupabaseBridge() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('ℹ️  Modo Local HTTP activo en http://localhost:' + PORT);
    console.log('   (Para usar desde celulares con 4G en Vercel, agregá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env)');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  realtimeChannel = supabase
    .channel('eco_aventura_whatsapp_bridge', {
      config: { broadcast: { self: false } },
    })
    .on('broadcast', { event: 'request_status' }, () => {
      broadcastStatusToSupabase();
    })
    .on('broadcast', { event: 'request_logout' }, async () => {
      if (sock) {
        await sock.logout().catch(() => {});
      }
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      startWhatsappSocket();
    })
    .on('broadcast', { event: 'send_sequence' }, async ({ payload }) => {
      if (!payload || !payload.jobId || !Array.isArray(payload.steps)) return;
      const { jobId, phone, steps, delayMs = 1400 } = payload;

      try {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          realtimeChannel.send({
            type: 'broadcast',
            event: 'send_progress',
            payload: {
              jobId,
              currentStep: i + 1,
              totalSteps: steps.length,
              stepTitle: step.title,
              status: 'sending',
            },
          });

          await sendSingleStep(phone, step);

          if (i < steps.length - 1) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }

        realtimeChannel.send({
          type: 'broadcast',
          event: 'send_progress',
          payload: {
            jobId,
            currentStep: steps.length,
            totalSteps: steps.length,
            stepTitle: '¡Secuencia enviada con éxito!',
            status: 'completed',
          },
        });
      } catch (err) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'send_progress',
          payload: {
            jobId,
            currentStep: 1,
            totalSteps: steps.length,
            stepTitle: 'Error al enviar',
            status: 'error',
            error: err?.message || 'Error enviando por WhatsApp',
          },
        });
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('☁️  Conectado a Supabase Realtime (Celulares en 4G pueden disparar mensajes remotos).');
        broadcastStatusToSupabase();
      }
    });
}

// Create HTTP server for local/network/tunnel access
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check / root check
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bridge: 'eco-aventura-whatsapp' }));
    return;
  }

  if (req.method === 'GET' && req.url === '/api/status') {

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStatusPayload()));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/logout') {
    if (sock) {
      await sock.logout().catch(() => {});
    }
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    startWhatsappSocket();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/send-step') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { phone, step } = JSON.parse(body);
        await sendSingleStep(phone, step);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'Error enviando mensaje' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚣 Servidor WhatsApp QR Eco Aventura corriendo en puerto ${PORT}`);
  initSupabaseBridge();
  startWhatsappSocket();
});

