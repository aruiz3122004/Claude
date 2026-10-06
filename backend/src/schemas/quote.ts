import { z } from 'zod';

/**
 * Enum de servicios — fuente de verdad: data-model.md § F.
 */
export const servicioEnum = z.enum([
  'residencial',
  'comercial',
  'industrial',
  'portones',
  'barandas',
  'mobiliario',
  'otro',
]);
export type Servicio = z.infer<typeof servicioEnum>;

/**
 * Validación de teléfono colombiano / internacional:
 * - acepta '+', dígitos, espacios y guiones en la entrada
 * - al limpiar debe quedar entre 7 y 15 dígitos (coincide con OpenAPI 7..15)
 */
const telefonoSchema = z
  .string()
  .trim()
  .max(32)
  .transform((raw, ctx) => {
    const limpio = raw.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,15}$/.test(limpio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'telefono inválido: usa 7..15 dígitos, opcionalmente con prefijo +',
      });
      return z.NEVER;
    }
    return limpio;
  });

/**
 * QuoteInputSchema: contrato POST /api/quotes
 * `.strict()` rechaza campos extra; `website` es honeypot.
 */
export const QuoteInputSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'nombre muy corto')
      .max(120, 'nombre muy largo'),
    telefono: telefonoSchema,
    email: z.string().trim().toLowerCase().email('email inválido').max(254),
    servicio: servicioEnum,
    mensaje: z.string().trim().min(10).max(2000),
    consentimiento: z.literal(true, {
      errorMap: () => ({ message: 'consentimiento requerido' }),
    }),
    consentimiento_version: z.string().min(1).max(32),
    origen: z.string().min(1).max(64).optional().default('web-landing'),
    website: z.string().max(0).optional().default(''), // honeypot
  })
  .strict();

export type QuoteInput = z.infer<typeof QuoteInputSchema>;

/**
 * Payload sin honeypot/campos auxiliares para pasar a database.createQuote.
 */
export function toCoreInput(parsed: QuoteInput) {
  return {
    nombre: parsed.nombre,
    telefono: parsed.telefono,
    email: parsed.email,
    servicio: parsed.servicio,
    mensaje: parsed.mensaje,
    origen: parsed.origen,
    consentimiento: parsed.consentimiento,
    consentimiento_version: parsed.consentimiento_version,
  };
}
