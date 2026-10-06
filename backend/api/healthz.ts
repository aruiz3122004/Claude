import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityHeaders } from '../src/lib/securityHeaders.js';

/**
 * Liveness: responde siempre que la función arranque.
 * Sin dependencias externas (no toca Sheets ni mail).
 */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  applySecurityHeaders(res);
  res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) });
}
