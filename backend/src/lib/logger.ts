import pino from 'pino';

/**
 * Logger JSON por línea. Redacta campos PII conocidos.
 * No se usan sinks a disco (serverless) — stdout vía Vercel.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'backend', env: process.env.NODE_ENV ?? 'development' },
  redact: {
    paths: [
      'req.body.nombre',
      'req.body.telefono',
      'req.body.email',
      'req.body.mensaje',
      'nombre',
      'telefono',
      'email',
      'mensaje',
      'headers.authorization',
      'headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/** Devuelve un logger hijo con el requestId propagado. */
export function withRequestId(requestId: string) {
  return logger.child({ requestId });
}
