import http from 'node:http';
import { createClient } from "@libsql/client";
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = process.env.PORT || 3000;
const frontendDir = path.resolve(process.cwd(), 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const safePath = path.normalize(path.join(frontendDir, urlPath));
  if (!safePath.startsWith(frontendDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (!path.extname(safePath)) {
        const htmlFallback = safePath + '.html';
        fs.stat(htmlFallback, (err2, stat2) => {
          if (!err2 && stat2.isFile()) return streamFile(htmlFallback, stat2, req, res);
          notFound(res);
        });
        return;
      }
      notFound(res);
      return;
    }
    streamFile(safePath, stat, req, res);
  });
}

function streamFile(filePath, stat, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  const total = stat ? stat.size : 0;
  const range = req && req.headers ? req.headers.range : null;

  if (range && total > 0) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

    if (isNaN(start) || start >= total || (parts[1] && end >= total) || start > end) {
      res.writeHead(416, {
        'Content-Range': `bytes */${total}`,
        'Content-Type': 'text/plain',
      });
      res.end('416 Range Not Satisfiable');
      return;
    }

    const chunksize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': type,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    const headers = {
      'Accept-Ranges': 'bytes',
      'Content-Type': type,
      'Cache-Control': 'no-cache',
    };
    if (total > 0) headers['Content-Length'] = total;
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

// Inicialización del cliente de Turso en la nube
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Inicializar tabla en Turso de forma asíncrona al arrancar
async function initTursoDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reservas (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL,
        email TEXT NOT NULL,
        servicio TEXT NOT NULL,
        mensaje TEXT,
        origen TEXT DEFAULT 'web-landing',
        estado TEXT DEFAULT 'pendiente'
      );
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_reservas_timestamp ON reservas(timestamp);
    `);
    console.log('✅ Tablas verificadas/creadas correctamente en Turso (Nube).');
  } catch (err) {
    console.error('❌ Error al inicializar las tablas en Turso:', err.message);
  }
}

initTursoDb();

// Rate limiting simple en memoria (máximo 15 peticiones cada 5 minutos por IP)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count++;
  rateLimits.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Endpoint: GET /api/healthz
  if (req.method === 'GET' && (req.url === '/api/healthz' || req.url === '/healthz')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', database: 'turso', cloud: true }));
    return;
  }

  // Endpoint: /api/quotes (solo POST — recepción del formulario)
  if (req.url === '/api/quotes' && req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json', 'Allow': 'POST' });
    res.end(JSON.stringify({ error: 'method_not_allowed', hint: 'Este endpoint solo acepta POST desde el formulario de reservas.' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/quotes') {
    if (!checkRateLimit(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
      res.end(JSON.stringify({ error: 'rate_limited', mensaje: 'Demasiadas solicitudes. Espere un momento.' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 32 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'payload_too_large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');

        if (payload.website && String(payload.website).trim().length > 0) {
          console.log(`[BOT BLOQUEADO] Honeypot activado desde IP ${clientIp}`);
          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: '0000000000', estado: 'recibido' }));
          return;
        }

        const nombre = String(payload.nombre || '').trim();
        const telefono = String(payload.telefono || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const servicio = String(payload.servicio || '').trim();
        const mensaje = String(payload.mensaje || '').trim();

        if (!nombre || !telefono || !email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'validation', detalles: ['Nombre, teléfono y correo son requeridos'] }));
          return;
        }

        const id = 'RSV-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const timestamp = new Date().toISOString();

        // Inserción en la base de datos Turso (Cloud)
        await db.execute({
          sql: `
            INSERT INTO reservas (id, timestamp, nombre, telefono, email, servicio, mensaje, origen, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
          `,
          args: [id, timestamp, nombre, telefono, email, servicio, mensaje, payload.origen || 'web-landing']
        });

        console.log(`\n🌴 [NUEVA RESERVA GUARDADA EN TURSO]`);
        console.log(`   ID:        ${id}`);
        console.log(`   Cliente:   ${nombre} (${telefono} / ${email})`);
        console.log(`   Servicio:  ${servicio}`);
        console.log(`   Mensaje:   ${mensaje.substring(0, 60)}...\n`);

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, estado: 'recibido' }));
      } catch (err) {
        console.error('❌ Error al procesar reserva en Turso:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal_error' }));
      }
    });
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n============================================================`);
  console.log(`🌴 PUERTA SAMARIA — SERVIDOR ACTIVO (TURSO NUBE + FRONTEND)`);
  console.log(`🌐 Sitio:              http://localhost:${PORT}/`);
  console.log(`📬 Recibo reservas:  POST ${PORT}/api/quotes (hacia Turso)`);
  console.log(`📋 Ver reservas:     npm run ver-reservas (lectura en nube)`);
  console.log(`============================================================\n`);
});
