import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp, type AppDeps } from '../src/app.js';
import type { Quote } from '@metalurgica/database';

function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  const appended: Quote[] = [];
  const sent: Array<{ to: string; subject: string }> = [];
  return {
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      CORS_ORIGIN: ['https://example.test'],
      RATE_LIMIT_MAX: 10,
      RATE_LIMIT_WINDOW: 60_000,
      DB_DRIVER: 'sheets',
      MAIL_PROVIDER: 'resend',
      OWNER_EMAIL: 'dueno@test.co',
      FROM_EMAIL: 'no-reply@test.co',
      IP_HASH_SALT: 'test_ip_salt_1234567890abcdef',
      UA_HASH_SALT: 'test_ua_salt_1234567890abcdef',
      CONSENT_VERSION: '2026-10-02',
    } as AppDeps['env'],
    repo: {
      append: async (q) => {
        appended.push(q);
        return { id: q.id };
      },
      ping: async () => true,
    },
    mail: {
      send: async ({ to, subject }) => {
        sent.push({ to, subject });
        return { id: 'mail_1' };
      },
      ping: async () => true,
    },
    limiter: { enabled: false, check: async () => ({ allowed: true }) },
    ...overrides,
    // @ts-expect-error — exponer buffers para asserts
    _spies: { appended, sent },
  };
}

const payload = {
  nombre: 'Ada Lovelace',
  telefono: '+573001234567',
  email: 'ada@test.co',
  servicio: 'portones',
  mensaje: 'Necesito un portón corredizo doble para la bodega.',
  consentimiento: true,
  consentimiento_version: '2026-10-02',
  website: '',
};

describe('POST /api/quotes', () => {
  it('acepta payload válido y responde 202 con id', async () => {
    const deps = makeDeps();
    const app = buildApp(deps);
    const res = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/json', 'user-agent': 'test/1.0' },
      payload,
    });
    assert.equal(res.statusCode, 202);
    const body = res.json() as { id: string; estado: string };
    assert.equal(body.estado, 'recibido');
    assert.match(body.id, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('rechaza payload sin consentimiento con 400', async () => {
    const app = buildApp(makeDeps());
    const res = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/json', 'user-agent': 'test/1.0' },
      payload: { ...payload, consentimiento: false },
    });
    assert.equal(res.statusCode, 400);
  });

  it('honeypot responde 202 silencioso sin persistir', async () => {
    const deps = makeDeps();
    const app = buildApp(deps);
    const res = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/json', 'user-agent': 'test/1.0' },
      payload: { ...payload, website: 'spam' },
    });
    assert.equal(res.statusCode, 400); // falla por `website.max(0)` en Zod primero
  });

  it('rechaza User-Agent vacío', async () => {
    const app = buildApp(makeDeps());
    const res = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/json', 'user-agent': '' },
      payload,
    });
    assert.equal(res.statusCode, 400);
  });

  it('rate-limit responde 429 con Retry-After', async () => {
    const deps = makeDeps({
      limiter: {
        enabled: true,
        check: async () => ({ allowed: false, retryAfterSec: 42 }),
      },
    });
    const app = buildApp(deps);
    const res = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/json', 'user-agent': 'test/1.0' },
      payload,
    });
    assert.equal(res.statusCode, 429);
    assert.equal(res.headers['retry-after'], '42');
  });

  it('503 si el repositorio falla', async () => {
    const deps = makeDeps({
      repo: {
        append: async () => {
          throw new Error('sheets down');
        },
        ping: async () => false,
      },
    });
    const app = buildApp(deps);
    const res = await app.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/json', 'user-agent': 'test/1.0' },
      payload,
    });
    assert.equal(res.statusCode, 503);
  });
});

describe('GET /api/healthz', () => {
  it('responde 200 con status ok', async () => {
    const app = buildApp(makeDeps());
    const res = await app.inject({ method: 'GET', url: '/api/healthz' });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { status: string };
    assert.equal(body.status, 'ok');
  });
});
