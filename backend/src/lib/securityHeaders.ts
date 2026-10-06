import type { VercelResponse } from '@vercel/node';

/**
 * Cabeceras de seguridad mínimas aplicables a respuestas de API JSON.
 * HSTS lo pone Vercel por defecto en el dominio productivo.
 */
export function applySecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'no-store');
}
