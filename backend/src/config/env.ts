import { z } from 'zod';

/**
 * Esquema de variables de entorno.
 * Fail-fast: si falta algo requerido, el import de este módulo lanza.
 * Los secretos marcados en env.md como "sí" son requeridos solo cuando aplica
 * el driver / proveedor correspondiente.
 */
const BaseEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default('')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),

  // Rate limit
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60_000),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // DB (consumido por database/, pero validamos presencia aquí también)
  DB_DRIVER: z.enum(['sheets', 'excel']).default('sheets'),

  // Mail
  MAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
  OWNER_EMAIL: z.string().email(),
  FROM_EMAIL: z.string().email(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (typeof v === 'string' ? v === 'true' : v)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Seguridad / privacidad
  IP_HASH_SALT: z.string().min(16),
  UA_HASH_SALT: z.string().min(16),
  CONSENT_VERSION: z.string().min(1),
});

export type Env = z.infer<typeof BaseEnv>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;
  const parsed = BaseEnv.safeParse(source);
  if (!parsed.success) {
    const detalles = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Config inválida:\n- ${detalles.join('\n- ')}`);
  }
  // Reglas condicionales por proveedor de correo.
  const env = parsed.data;
  if (env.MAIL_PROVIDER === 'resend' && !env.RESEND_API_KEY) {
    throw new Error('MAIL_PROVIDER=resend requiere RESEND_API_KEY');
  }
  if (env.MAIL_PROVIDER === 'smtp') {
    const missing = (['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] as const).filter(
      (k) => !env[k],
    );
    if (missing.length) {
      throw new Error(`MAIL_PROVIDER=smtp requiere: ${missing.join(', ')}`);
    }
  }
  cached = env;
  return env;
}
