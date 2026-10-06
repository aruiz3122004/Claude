import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp, getDefaultDeps } from '../src/app.js';
import { applyCors } from '../src/lib/cors.js';
import { applySecurityHeaders } from '../src/lib/securityHeaders.js';

// Singleton por worker: Vercel conserva este módulo entre invocaciones calientes.
const deps = getDefaultDeps();
const app = buildApp(deps);

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);
  const corsOk = applyCors(req, res, deps.env.CORS_ORIGIN);

  if (req.method === 'OPTIONS') {
    res.status(corsOk ? 204 : 403).end();
    return;
  }

  if (!corsOk) {
    res.status(403).json({ error: 'cors_denied' });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const injected = await app.inject({
    method: 'POST',
    url: '/api/quotes',
    headers: toInjectHeaders(req.headers),
    payload: req.body as unknown,
  });

  forward(res, injected);
}

function forward(res: VercelResponse, injected: Awaited<ReturnType<ReturnType<typeof buildApp>['inject']>>): void {
  for (const [k, v] of Object.entries(injected.headers)) {
    if (v === undefined || k.toLowerCase() === 'content-length') continue;
    res.setHeader(k, v as string | string[]);
  }
  res.status(injected.statusCode).send(injected.body);
}

function toInjectHeaders(h: VercelRequest['headers']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v) ? v.join(',') : v;
  }
  return out;
}
