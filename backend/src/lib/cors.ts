import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Devuelve `true` si el origen está permitido o si no hay origin header.
 * Reglas:
 *  - whitelist exacta por entrada en CORS_ORIGIN
 *  - además, cualquier `https://*.vercel.app` para previews
 */
export function isAllowedOrigin(origin: string | undefined, whitelist: string[]): boolean {
  if (!origin) return true;
  if (whitelist.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }
  return false;
}

/** Aplica cabeceras CORS al response. Debe llamarse antes de escribir el body. */
export function applyCors(req: VercelRequest, res: VercelResponse, whitelist: string[]): boolean {
  const origin = req.headers.origin;
  const allowed = isAllowedOrigin(origin, whitelist);
  if (origin && allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
  return allowed;
}
