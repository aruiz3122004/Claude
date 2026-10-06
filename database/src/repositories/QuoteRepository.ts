import { ulid } from 'ulid';

export type Servicio =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'portones'
  | 'barandas'
  | 'mobiliario'
  | 'otro';

export interface Quote {
  id: string;
  timestamp: string;
  nombre: string;
  telefono: string;
  email: string;
  servicio: Servicio;
  mensaje: string;
  origen: string;
  consentimiento: true;
  consentimiento_version: string;
  ip_hash: string;
  user_agent_hash: string;
  /**
   * Fecha ISO-8601 UTC del último contacto registrado con el prospecto.
   * Vacío (`""`) al crear la cotización inicial. Lo escribe backend / proceso
   * interno vía `QuoteRepository.touch(id)`.
   * Usado para medir la retención a 24 meses como MAX(timestamp, ultimo_contacto).
   */
  ultimo_contacto?: string;
}

/**
 * Entrada que llega del formulario. `ultimo_contacto` NO está aquí: solo se
 * genera después de la creación inicial, nunca en el POST original.
 */
export interface QuoteInput {
  nombre: string;
  telefono: string;
  email: string;
  servicio: Servicio;
  mensaje: string;
  origen: string;
  consentimiento: true;
  consentimiento_version: string;
}

export interface QuoteMeta {
  ip_hash: string;
  user_agent_hash: string;
}

export class QuoteNotFoundError extends Error {
  readonly code = 'QUOTE_NOT_FOUND';
  constructor(id: string) {
    super(`Quote no encontrada: id=${id}`);
    this.name = 'QuoteNotFoundError';
  }
}

export interface QuoteRepository {
  append(quote: Quote): Promise<{ id: string }>;
  ping(): Promise<boolean>;
  /**
   * Marca la fila con el `id` dado estampando `ultimo_contacto` al ISO actual UTC.
   * Lanza `QuoteNotFoundError` si no existe la fila.
   * Opcional en v2: una implementación puede dejar un `TODO` controlado si el
   * caso de uso aún no está habilitado, pero debe declararse en la interfaz.
   */
  touch(id: string): Promise<void>;
}

export function createQuote(input: QuoteInput, meta: QuoteMeta): Quote {
  return {
    id: ulid(),
    timestamp: new Date().toISOString(),
    nombre: input.nombre,
    telefono: input.telefono,
    email: input.email,
    servicio: input.servicio,
    mensaje: input.mensaje,
    origen: input.origen,
    consentimiento: input.consentimiento,
    consentimiento_version: input.consentimiento_version,
    ip_hash: meta.ip_hash,
    user_agent_hash: meta.user_agent_hash,
    ultimo_contacto: '',
  };
}

export const QUOTE_COLUMNS = [
  'id',
  'timestamp',
  'nombre',
  'telefono',
  'email',
  'servicio',
  'mensaje',
  'origen',
  'consentimiento',
  'consentimiento_version',
  'ip_hash',
  'user_agent_hash',
  'ultimo_contacto',
] as const;

export type QuoteColumn = (typeof QUOTE_COLUMNS)[number];

export function quoteToRow(q: Quote): (string | boolean)[] {
  return [
    q.id,
    q.timestamp,
    q.nombre,
    q.telefono,
    q.email,
    q.servicio,
    q.mensaje.replace(/\r?\n/g, '\\n'),
    q.origen,
    q.consentimiento,
    q.consentimiento_version,
    q.ip_hash,
    q.user_agent_hash,
    q.ultimo_contacto ?? '',
  ];
}
