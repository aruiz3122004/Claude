import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QuoteInputSchema } from '../src/schemas/quote.js';

const base = {
  nombre: 'Ada Lovelace',
  telefono: '+57 300 123 4567',
  email: 'ADA@test.co',
  servicio: 'portones',
  mensaje: 'Necesito un portón corredizo doble.',
  consentimiento: true,
  consentimiento_version: '2026-10-02',
  website: '',
};

describe('QuoteInputSchema', () => {
  it('acepta un payload válido y normaliza email + teléfono', () => {
    const r = QuoteInputSchema.parse(base);
    assert.equal(r.email, 'ada@test.co');
    assert.equal(r.telefono, '+573001234567');
    assert.equal(r.origen, 'web-landing');
  });

  it('rechaza consentimiento = false', () => {
    assert.throws(() => QuoteInputSchema.parse({ ...base, consentimiento: false }));
  });

  it('rechaza campos extra (strict)', () => {
    assert.throws(() => QuoteInputSchema.parse({ ...base, extra: 'nope' }));
  });

  it('rechaza teléfono inválido', () => {
    assert.throws(() => QuoteInputSchema.parse({ ...base, telefono: '123' }));
  });

  it('rechaza servicio fuera del enum', () => {
    assert.throws(() => QuoteInputSchema.parse({ ...base, servicio: 'otra-cosa' }));
  });

  it('rechaza mensaje de menos de 10 chars', () => {
    assert.throws(() => QuoteInputSchema.parse({ ...base, mensaje: 'hola' }));
  });

  it('rechaza nombre corto', () => {
    assert.throws(() => QuoteInputSchema.parse({ ...base, nombre: 'A' }));
  });

  it('acepta honeypot vacío y rechaza no-vacío', () => {
    assert.doesNotThrow(() => QuoteInputSchema.parse({ ...base, website: '' }));
    assert.throws(() => QuoteInputSchema.parse({ ...base, website: 'x' }));
  });
});
