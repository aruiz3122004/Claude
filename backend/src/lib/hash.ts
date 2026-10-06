import { createHash } from 'node:crypto';

/**
 * sha256(value + salt) en hex, truncado a `length` chars.
 * Determinista — permite agrupar sin almacenar el valor en claro.
 */
export function saltedHash(value: string, salt: string, length = 32): string {
  return createHash('sha256').update(value, 'utf8').update(salt, 'utf8').digest('hex').slice(0, length);
}

/** Hash de IP cliente con sal dedicada. */
export function hashIp(ip: string, salt: string): string {
  return saltedHash(ip || 'unknown', salt);
}

/** Hash de User-Agent (truncado antes de hashear para estabilizar). */
export function hashUa(ua: string, salt: string): string {
  const trimmed = (ua || 'unknown').slice(0, 200);
  return saltedHash(trimmed, salt);
}
