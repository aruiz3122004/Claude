import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger.js';
import type { Env } from '../config/env.js';

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSec?: number;
  remaining?: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitDecision>;
  enabled: boolean;
}

/**
 * Fabrica un limitador por IP con ventana deslizante.
 * Si faltan credenciales de Upstash, devuelve un no-op con advertencia:
 * las defensas restantes (honeypot, Zod .strict(), body cap) cubren el MVP.
 */
export function createRateLimiter(env: Env): RateLimiter {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn({ rateLimit: 'disabled' }, 'Rate limit deshabilitado: faltan credenciales Upstash');
    return {
      enabled: false,
      async check() {
        return { allowed: true };
      },
    };
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_MAX, `${env.RATE_LIMIT_WINDOW} ms`),
    prefix: 'rl:quotes',
    analytics: false,
  });

  return {
    enabled: true,
    async check(key: string) {
      const r = await limiter.limit(key);
      if (r.success) {
        return { allowed: true, remaining: r.remaining };
      }
      const retryAfterSec = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
      return { allowed: false, retryAfterSec, remaining: 0 };
    },
  };
}
