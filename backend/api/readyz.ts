import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDefaultDeps, readiness } from '../src/app.js';
import { applySecurityHeaders } from '../src/lib/securityHeaders.js';

const deps = getDefaultDeps();

/**
 * Readiness: chequea repo.ping() y mail.ping() con cache de 30 s.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);
  const { ok, detail } = await readiness(deps);
  res.status(ok ? 200 : 503).json(detail);
}
