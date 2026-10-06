import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { getQuoteRepository, createQuote, type QuoteRepository } from '@metalurgica/database';
import { loadEnv, type Env } from './config/env.js';
import { QuoteInputSchema, toCoreInput } from './schemas/quote.js';
import { hashIp, hashUa } from './lib/hash.js';
import { logger, withRequestId } from './lib/logger.js';
import { createRateLimiter, type RateLimiter } from './lib/rateLimit.js';
import { getMailProvider, type MailProvider } from './mail/index.js';
import { ownerEmailHtml, ownerEmailSubject, ownerEmailText } from './lib/templates/ownerEmail.js';

/**
 * Capa de dependencias — permite inyectar en tests.
 */
export interface AppDeps {
  env: Env;
  repo: QuoteRepository;
  mail: MailProvider;
  limiter: RateLimiter;
}

/**
 * Compone dependencias por defecto desde process.env.
 * Cachea por módulo: Vercel reutiliza workers calientes y evita re-crear.
 */
let cachedDeps: AppDeps | null = null;
export function getDefaultDeps(): AppDeps {
  if (cachedDeps) return cachedDeps;
  const env = loadEnv();
  cachedDeps = {
    env,
    repo: getQuoteRepository(process.env),
    mail: getMailProvider(env),
    limiter: createRateLimiter(env),
  };
  return cachedDeps;
}

/**
 * Construye la instancia Fastify. Usada vía `fastify.inject()` desde los handlers Vercel.
 */
export function buildApp(deps: AppDeps = getDefaultDeps()): FastifyInstance {
  const app = Fastify({
    logger: false, // delegamos a pino directo con requestId manual
    bodyLimit: 32 * 1024, // 32 KiB es sobrado para una cotización
    disableRequestLogging: true,
    genReqId: (req) => (req.headers['x-vercel-id'] as string | undefined) ?? randomUUID(),
  });

  app.post('/api/quotes', async (req, reply) => {
    const log = withRequestId(req.id);
    const started = Date.now();

    // 1. Parseo + validación estricta
    const parsed = QuoteInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const detalles = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
      log.info({ status: 400, detalles }, 'validation_failed');
      return reply.code(400).send({ error: 'validation', detalles });
    }
    const input = parsed.data;

    // 2. Honeypot: si trae contenido, 202 silencioso (no revelamos la trampa)
    if (input.website.length > 0) {
      log.warn({ status: 202, honeypot: true }, 'honeypot_tripped');
      return reply.code(202).send({ id: '00000000000000000000000000', estado: 'recibido' });
    }

    // 3. Bloqueo barato: User-Agent vacío (bots triviales)
    const ua = (req.headers['user-agent'] ?? '').toString();
    if (ua.trim().length === 0) {
      log.warn({ status: 400 }, 'empty_user_agent');
      return reply.code(400).send({ error: 'validation', detalles: ['user_agent requerido'] });
    }

    // 4. Rate-limit por IP
    const ip = clientIp(req.headers);
    const rl = await deps.limiter.check(ip);
    if (!rl.allowed) {
      reply.header('Retry-After', String(rl.retryAfterSec ?? 60));
      log.info({ status: 429 }, 'rate_limited');
      return reply.code(429).send({ error: 'rate_limited' });
    }

    // 5. Compone y persiste
    const meta = {
      ip_hash: hashIp(ip, deps.env.IP_HASH_SALT),
      user_agent_hash: hashUa(ua, deps.env.UA_HASH_SALT),
    };
    const quote = createQuote(toCoreInput(input), meta);

    try {
      await withRetry(() => deps.repo.append(quote), 2, [200, 600]);
    } catch (err) {
      log.error({ status: 503, err: errMsg(err) }, 'persistence_failed');
      return reply.code(503).send({ error: 'persistence_unavailable' });
    }

    // 6. Correo al dueño (no bloqueante del éxito del request)
    const mailPromise = deps.mail
      .send({
        to: deps.env.OWNER_EMAIL,
        subject: ownerEmailSubject(quote),
        html: ownerEmailHtml(quote),
        text: ownerEmailText(quote),
        replyTo: quote.email,
      })
      .then((r) => log.info({ mailId: r.id, quoteId: quote.id }, 'mail_sent'))
      .catch((err) => log.error({ quoteId: quote.id, err: errMsg(err) }, 'mail_failed'));

    // Aseguramos que el worker no muere antes del envío (Vercel). allSettled devuelve siempre.
    await Promise.allSettled([mailPromise]);

    log.info(
      { status: 202, quoteId: quote.id, durationMs: Date.now() - started },
      'quote_accepted',
    );
    return reply.code(202).send({ id: quote.id, estado: 'recibido' });
  });

  app.get('/api/healthz', async () => {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  });

  app.get('/api/readyz', async (_req, reply) => {
    const result = await readiness(deps);
    const code = result.ok ? 200 : 503;
    return reply.code(code).send(result.detail);
  });

  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: 'not_found' }));

  app.setErrorHandler((err, req, reply) => {
    const log = withRequestId(req.id);
    log.error({ err: errMsg(err) }, 'unhandled_error');
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    const payload = status === 500 ? { error: 'internal', requestId: req.id } : { error: err.message };
    return reply.code(status).send(payload);
  });

  return app;
}

/**
 * Cache 30 s del resultado de readyz para no sobrecargar Sheets/mail.
 */
let readyCache: { at: number; detail: Record<string, string>; ok: boolean } | null = null;
export async function readiness(deps: AppDeps) {
  const now = Date.now();
  if (readyCache && now - readyCache.at < 30_000) {
    return { ok: readyCache.ok, detail: readyCache.detail };
  }
  const [repoOk, mailOk] = await Promise.all([
    safeCall(() => deps.repo.ping()),
    safeCall(() => deps.mail.ping()),
  ]);
  const detail = {
    sheets: repoOk ? 'ok' : 'fail',
    mail: mailOk ? 'ok' : 'fail',
  };
  const ok = repoOk && mailOk;
  readyCache = { at: now, detail, ok };
  return { ok, detail };
}

function clientIp(headers: Record<string, string | string[] | undefined>): string {
  const xff = headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (raw) {
    const first = raw.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = headers['x-real-ip'];
  if (typeof real === 'string' && real) return real;
  return 'unknown';
}

async function safeCall(fn: () => Promise<boolean>): Promise<boolean> {
  try {
    return await Promise.race([
      fn(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1_500)),
    ]);
  } catch {
    return false;
  }
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number, backoffsMs: number[]): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout_2500ms')), 2_500)),
      ]);
    } catch (err) {
      lastErr = err;
      if (i === attempts) break;
      const base = backoffsMs[i] ?? 500;
      const jitter = Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('append_failed');
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}

export { logger };
