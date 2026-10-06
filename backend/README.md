# Metalúrgica del Caribe — Backend

Servicio serverless (Vercel) de captura de cotizaciones.
Node 20 LTS · Fastify (via `inject`) · TypeScript estricto · Zod.

## Rutas
- `POST /api/quotes` — valida con Zod, aplica rate-limit por IP (Upstash), guarda vía `QuoteRepository` (@metalurgica/database) y avisa por correo (`MailProvider`). Devuelve `202 { id, estado }`.
- `GET /api/healthz` — liveness, sin dependencias.
- `GET /api/readyz` — readiness, chequea `repo.ping()` + `mail.ping()` (cache 30 s).

## Dev local
Requisitos: Node 20, `vercel` CLI (`npm i -g vercel`).

```bash
# Desde la raíz del monorepo (una vez):
npm install

# Crear backend/.env con las variables documentadas en docs/contracts/env.md
# Añadir, además:
#   UPSTASH_REDIS_REST_URL=...   (opcional; sin él, rate-limit degradado)
#   UPSTASH_REDIS_REST_TOKEN=...
#   UA_HASH_SALT=...             (secreto, 32 bytes aleatorios)

# Arranque local
cd backend
npx vercel dev
```

### Prueba rápida (curl)
```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -H "Origin: https://metalurgicadelcaribe.co" \
  -d '{
    "nombre": "Ada Lovelace",
    "telefono": "+573001234567",
    "email": "ada@test.co",
    "servicio": "portones",
    "mensaje": "Necesito un portón corredizo doble.",
    "consentimiento": true,
    "consentimiento_version": "2026-10-02",
    "website": ""
  }'
```

## Scripts
- `npm --workspace @metalurgica/backend run typecheck` — tsc sin emit.
- `npm --workspace @metalurgica/backend run test` — Node test runner + tsx.
- `npm --workspace @metalurgica/backend run dev` — `vercel dev` desde backend/.

## Estructura
Ver `PLAN.md §1`. En resumen:
```
api/        handlers Vercel (quotes.ts, healthz.ts, readyz.ts)
src/app.ts  Fastify singleton compartido entre invocaciones
src/schemas Zod del body
src/mail    MailProvider + Resend + SMTP + factory
src/lib     hash, logger, rate-limit, cors, headers, templates
```

## Decisiones clave
- **Vercel + Fastify via `inject`**: tipos y validación como en Node clásico, sin servidor TCP.
- **Rate-limit en Upstash**: único almacén compartido entre funciones serverless.
- **Mail pluggable**: Resend por defecto (HTTP, ideal serverless) o SMTP vía Nodemailer.
- **Logs JSON sin PII**: `pino` con `redact` para `email`, `telefono`, `nombre`, `mensaje`.
- **Deny-by-default**: solo POST en `/api/quotes`, resto → 405.
