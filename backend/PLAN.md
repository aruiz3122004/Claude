# backend/PLAN.md

arq_leída: 2.0 (2026-10-02)
contratos: `docs/contracts/api.openapi.yaml` v2.0.0, `docs/contracts/env.md` v1, `docs/contracts/data-model.md` v1
estado: BUILD completo (G3)
agente: backend

## 1. Estructura de carpetas

```
backend/
  api/                        # Entry points de Vercel (uno por ruta HTTP)
    quotes.ts                 # POST /api/quotes
    healthz.ts                # GET  /api/healthz   (liveness)
    readyz.ts                 # GET  /api/readyz    (readiness)
  src/
    app.ts                    # Fastify "singleton por invocación" + registro de rutas
    config/
      env.ts                  # Esquema Zod de env + loader fail-fast
    schemas/
      quote.ts                # QuoteInputSchema + tipos derivados + helpers
    mail/
      MailProvider.ts         # Interfaz pluggable
      ResendMailProvider.ts
      SmtpMailProvider.ts
      index.ts                # getMailProvider()
    lib/
      hash.ts                 # sha256 truncado con sal
      logger.ts               # pino + redact PII
      rateLimit.ts            # Upstash + modo degradado
      cors.ts                 # evalúa origen contra whitelist
      securityHeaders.ts      # cabeceras base
      templates/
        ownerEmail.ts         # html + text del aviso al dueño
  test/
    quote.schema.test.ts
    quotes.handler.test.ts
  README.md
  PLAN.md
  package.json
  tsconfig.json
```

El esquema de datos y los repositorios **se importan** desde `@metalurgica/database` (ver §9 Monorepo). No se duplica aquí.

## 2. Endpoints → RF → roles

| Método | Ruta             | Vercel file           | RF           | Rol        | Rate-limit |
|--------|------------------|-----------------------|--------------|------------|------------|
| POST   | `/api/quotes`    | `api/quotes.ts`       | RF-04, RF-10 | Anónimo    | sí (estricto) |
| GET    | `/api/healthz`   | `api/healthz.ts`      | NFR salud    | Anónimo    | no         |
| GET    | `/api/readyz`    | `api/readyz.ts`       | NFR salud    | Anónimo    | no         |

**Un único rol público** (visitante anónimo). No hay autenticación en el sitio: la matriz de roles de ARCHITECTURE §6 lo deja explícito. No hay recursos autenticados, por tanto no hay matriz rol × endpoint que testear más allá de "cualquier visitante puede crear una cotización".

## 3. Estrategia de autenticación y autorización

**Autenticación: ninguna.** El formulario es público. No se emiten cookies ni tokens. No hay sesión.

**Autorización: `deny-by-default` por método y ruta.** Los únicos verbos permitidos son los listados en §2. Cualquier otro combo responde `405` (desde el handler) o `404` (desde Vercel si la ruta no existe).

**Mitigaciones de abuso que suplen la ausencia de auth:**
- Honeypot `website` (RF-04, §11 ARCH).
- Rate-limit por IP (ver §4).
- Validación estricta Zod con `strict()` (rechaza campos extra).
- Longitud máxima del body (1 MiB) impuesta por Vercel más validación de tamaño string en Zod.
- Hashing con sal de IP y User-Agent antes de persistir (CMP-05).

**Mínimo privilegio hacia abajo:** el backend solo tiene credenciales para (a) la hoja `quotes` (service account con scope `spreadsheets` sobre el `SHEET_ID` concreto), (b) el proveedor de correo. Ningún permiso en Drive o en cuentas más amplias.

## 4. Rate limiting

- **Default: Upstash Redis + `@upstash/ratelimit`.** Sliding window `RATE_LIMIT_MAX` req / `RATE_LIMIT_WINDOW` ms por IP (por defecto 10/60 s según `env.md`). Clave `rl:quotes:<ip>`. Funciona entre invocaciones serverless porque el estado vive en Upstash, no en memoria.
- **Modo degradado:** si faltan `UPSTASH_REDIS_REST_URL` o `UPSTASH_REDIS_REST_TOKEN`, el servidor arranca y log de advertencia (`rateLimit=disabled`). Las defensas restantes (honeypot, Zod `strict`, body cap, bloqueo de `User-Agent` vacío) son suficientes para el volumen esperado (<10 cotizaciones/día — ver ARCH §12). **Aceptable para MVP, no para alto tráfico.**
- Respuesta al excederse: `429` con header `Retry-After` en segundos, body `{"error":"rate_limited"}` (coincide con `components.schemas.Error` del OpenAPI).
- `/healthz` y `/readyz` **no** están rate-limited (son usados por monitors).

## 5. Integraciones

### 5.1 Persistencia — `QuoteRepository` (via `@metalurgica/database`)
- **Adaptador:** interfaz `QuoteRepository { append, ping }` ya definida por database. Backend solo la consume.
- **Factory:** `getQuoteRepository(env)` también vive en database. Backend llama una vez por invocación (reutilizable por el runtime de Vercel entre invocaciones calientes gracias a los módulos cacheados).
- **Timeout:** envoltorio local con `Promise.race` a 2.5 s (deja margen al p95 Sheets 300–900 ms + reintentos).
- **Reintentos:** 2 reintentos con backoff `[200, 600]` ms + jitter, **solo** sobre errores de red/5xx (idempotencia no garantizada pero `append` crea una fila nueva: duplicados ante un reintento son aceptables y preferibles a perder la cotización).
- **Si falla definitivo:** el handler responde `503 {"error":"persistence_unavailable"}`. (La cola JSONL BE-06 del PLAN original queda **fuera de alcance** en Vercel — el sistema de archivos es efímero y de solo-lectura excepto `/tmp`; se traslada a database como responsabilidad de drivers que persistan a Drive. Delta registrado en §10.)

### 5.2 Correo — `MailProvider`
- **Interfaz:**
  ```ts
  interface MailProvider {
    send(a: { to; subject; html; text; replyTo? }): Promise<{ id: string }>;
    ping(): Promise<boolean>;
  }
  ```
- **Implementaciones:** `ResendMailProvider` (default) y `SmtpMailProvider` (Nodemailer). Factory `getMailProvider()` lee `MAIL_PROVIDER` (`resend|smtp`, default `resend`).
- **Timeout:** 3 s en `send`, 1.5 s en `ping`.
- **Fire-and-forget:** se dispara con `Promise.allSettled` **antes** del `res.end()` para que Vercel no mate el worker, pero su fallo **no** aborta la respuesta — la cotización ya está persistida y se loguea el error con el id.
- **Reintentos:** 1 reintento (300 ms + jitter). Más que eso roba del p95.

## 6. Dependencias

| Paquete | Por qué | Dónde se usa |
|---------|---------|--------------|
| `fastify` | Validación/plugins maduros; se usa en modo "inject" dentro del handler Vercel (ver §12). | `src/app.ts` |
| `zod` | Validación declarativa, tipos derivados, `.strict()` para rechazar extras. | `src/schemas/quote.ts`, `src/config/env.ts` |
| `pino` | Logs JSON por línea con redactado configurable. | `src/lib/logger.ts` |
| `@upstash/ratelimit` + `@upstash/redis` | Único almacén compartido entre funciones serverless con free tier real. | `src/lib/rateLimit.ts` |
| `resend` | Proveedor de correo transaccional recomendado para serverless (HTTP, no mantiene sockets). | `src/mail/ResendMailProvider.ts` |
| `nodemailer` | Alternativa SMTP para quien ya tenga buzón. | `src/mail/SmtpMailProvider.ts` |
| `@metalurgica/database` | Repositorios y modelo `Quote` (único dueño del esquema). | `api/quotes.ts`, `api/readyz.ts` |
| `@vercel/node` | Tipos `VercelRequest`/`VercelResponse`. | `api/*.ts` |
| `tsx` | Runner TS para test y seeds locales. | dev |
| `typescript` | Compilación estricta. | dev |

Lo que **no entra** (y por qué):
- `@fastify/rate-limit`: in-memory, inútil en serverless.
- `@fastify/cors`, `@fastify/helmet`: aportan features innecesarias cuando ya controlamos las cabeceras manualmente desde un handler Vercel (ver `src/lib/cors.ts` y `securityHeaders.ts`). Mantienen el bundle pequeño y el cold start corto.
- Nada de "por si acaso" (dayjs, lodash, axios).

## 7. Compliance asignado al backend

De los CMP-01..08 de ARCHITECTURE §11, backend es responsable técnico de:

| ID       | Cómo se cumple |
|----------|----------------|
| CMP-01   | Zod exige `consentimiento === true` y `consentimiento_version` presente. Sin eso: `400`. |
| CMP-04   | Backend **no** retiene datos propios; retención la lleva Sheets. Logs sin PII (pino `redact`). |
| CMP-05   | HTTPS (Vercel), `IP_HASH_SALT` y `UA_HASH_SALT` para no persistir IP/UA en claro. Secretos sólo via env. |
| CMP-07   | N/A backend (frontend). |
| CMP-08   | N/A backend. |

Los demás son responsabilidad de governance (textos) o devops (infra).

## 8. Lo que necesito de otros agentes

**De `database`** (ya entregado):
- Interfaz `QuoteRepository`, factory `getQuoteRepository(env)`, helper `createQuote(input, meta)`, enums `Servicio`. ✅
- Script `seed:headers` para inicializar la hoja (fuera de este PR). ✅

**De `devops` (abre CR si cambia):**
- Variables `env.md` + añadir en el `.env.example`:
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (opcionales; sin ellas → modo degradado).
  - `UA_HASH_SALT` (secreta, 32 bytes aleatorios).
  - `MAIL_PROVIDER` por defecto `resend` (ARCH decía `smtp`; se actualiza).
- `vercel.json` con rutas `/api/*` y cabeceras base (opcional, el handler ya las pone).
- Configurar SPF/DKIM/DMARC para `FROM_EMAIL`.

**De `frontend`:**
- Enviar `Content-Type: application/json` y respetar el body exacto del contrato. Sin cambios respecto a OpenAPI.

## 9. Monorepo

Se añade `package.json` raíz con `workspaces: ["backend","database"]`. Esto hace que `backend` pueda `import { ... } from "@metalurgica/database"` sin paths relativos frágiles. `tsconfig.json` de backend tiene `paths` que apunta a `../database/src/repositories/index.ts` para que el type-check funcione sin build de database.

Instalación en raíz: `npm install` (una vez). Los agentes database/backend conservan su `package.json` autónomo.

## 10. Deltas respecto al ARCHITECTURE 2.0

1. **Despliegue serverless (Vercel), no PaaS con contenedor.** Decisión del usuario que sobrescribe ARCH §8. Impacto: no `index.ts` que `listen`, no Docker. Entry points son `api/*.ts`.
2. **Rate-limit en Upstash**, no `@fastify/rate-limit`. Añade dos variables de entorno (CR a devops).
3. **Cola JSONL BE-06 fuera de alcance** aquí: el filesystem serverless es efímero. La durabilidad extra queda en database (p. ej. driver con reintento + Drive). Se registra como riesgo R-BE-01.
4. **Default `MAIL_PROVIDER=resend`** (ARCH decía `smtp`). Resend es HTTP y encaja mejor con serverless (SMTP mantiene conexión).
5. **`UA_HASH_SALT` nueva.** El data-model.md guarda `user_agent` **truncado a 200**; database en código optó por `user_agent_hash` (SHA-256). Backend adopta `user_agent_hash` siguiendo al código vigente de database y añade la sal correspondiente. Delta a reportar al architect para alinear `data-model.md`.
6. **Rutas health bajo `/api/*`.** Vercel enruta por `/api/<file>`. OpenAPI dice `/healthz` y `/readyz` sin prefijo. Backend expone `/api/healthz` y `/api/readyz`. Delta menor para audit; el OpenAPI debe actualizarse o devops añadir redirects en `vercel.json`.

## 11. Cómo correr y probar

Local:
```
npm install                     # desde la raíz (workspaces)
cp backend/.env.example .env    # (devops provee .env.example)
npx vercel dev                  # desde backend/
```
Prueba:
```
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ada","telefono":"+573001234567","email":"ada@test.co",
       "servicio":"portones","mensaje":"Necesito un portón corredizo",
       "consentimiento":true,"consentimiento_version":"2026-10-02","website":""}'
```

Tests (Node test runner + tsx):
```
npm --workspace @metalurgica/backend test
```

## 12. Patrón Vercel elegido

**Handler nativo `@vercel/node` que delega en Fastify via `fastify.inject()`.**

Razón:
- Fastify arranca una sola vez por worker (singleton de módulo); `inject()` es síncrono respecto a sockets, ideal cuando no hay servidor TCP. Overhead < 2 ms por request después del cold start.
- Permite reutilizar el schema Zod y la lógica de plugins como en Node tradicional, sin fingir que escuchamos un puerto.
- Alternativa descartada: handler puro sin Fastify. Añadiría ruido para montar validación/errores a mano; Fastify ya está en el stack aprobado.
- Cold start medido en pruebas típicas (`fastify@4` + plugins mínimos): 60–140 ms en Vercel. Dentro del p95 1200 ms de ARCH §5.

## 13. Preguntas abiertas

- Dominio productivo exacto para `CORS_ORIGIN` (placeholder: `https://metalurgicadelcaribe.co` + `*.vercel.app`).
- ¿Mantener `MAIL_PROVIDER=smtp` como default (ARCH) o cambiarlo a `resend` (decisión del usuario para este sprint)? **Resolvemos: default `resend`** y documentamos.
- Audit debe validar si `/api/healthz` cumple el contrato OpenAPI que especifica `/healthz` a secas.
