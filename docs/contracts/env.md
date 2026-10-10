# Contrato de variables de entorno v2.1

Dueño: devops (a partir de v2). Última modificación: 2026-10-02.

## Backend (Vercel Functions `backend/api/*`)

### Obligatorias
| Variable | Propósito | Ejemplo | Secreta |
|----------|-----------|---------|---------|
| `LOG_LEVEL` | nivel pino | `info` | no |
| `CORS_ORIGIN` | dominio permitido (CSV) | `https://metalurgicadelcaribe.co` | no |
| `DB_DRIVER` | `sheets` o `excel` | `sheets` | no |
| `SHEET_ID` | id del Google Sheet | `1AbCdEf...` | no |
| `GOOGLE_SA_JSON` | credencial Service Account (JSON serializado en una línea) | `{"type":"service_account",...}` | **sí** |
| `MAIL_PROVIDER` | `resend` o `smtp`. **Default: `resend`.** | `resend` | no |
| `MAIL_FROM` | remitente verificado del dominio | `no-reply@metalurgicadelcaribe.co` | no |
| `OWNER_EMAIL` | destinatario del aviso al dueño | `dueno@metalurgicadelcaribe.co` | no |
| `IP_HASH_SALT` | sal para hash de IP (SHA-256) | 32 bytes aleatorios base64 | **sí** |
| `UA_HASH_SALT` | sal para hash de User-Agent (SHA-256). Requerida por minimización PII. | 32 bytes aleatorios base64 | **sí** |
| `CONSENT_VERSION` | versión del aviso vigente | `2026-10-02` | no |

### Condicionales (según `MAIL_PROVIDER`)
| Variable | Propósito | Ejemplo | Secreta |
|----------|-----------|---------|---------|
| `RESEND_API_KEY` | api key Resend (obligatoria si `MAIL_PROVIDER=resend`) | `re_***` | **sí** |
| `SMTP_HOST` | host SMTP (obligatoria si `MAIL_PROVIDER=smtp`) | `smtp.hostinger.com` | no |
| `SMTP_PORT` | puerto SMTP | `587` | no |
| `SMTP_SECURE` | TLS | `false` | no |
| `SMTP_USER` | usuario SMTP | `no-reply@...` | **sí** |
| `SMTP_PASS` | contraseña SMTP | `***` | **sí** |

### Condicionales (según `DB_DRIVER`)
| Variable | Propósito | Ejemplo | Secreta |
|----------|-----------|---------|---------|
| `EXCEL_PATH` | ruta al xlsx (solo si `DB_DRIVER=excel`) | `./data/quotes.xlsx` | no |

### Opcionales — rate-limit distribuido (Upstash Redis)
| Variable | Propósito | Ejemplo | Secreta |
|----------|-----------|---------|---------|
| `UPSTASH_REDIS_REST_URL` | endpoint REST de Upstash para rate-limit persistente entre invocaciones serverless | `https://xxx.upstash.io` | no |
| `UPSTASH_REDIS_REST_TOKEN` | token REST de Upstash | `AX...` | **sí** |

**Modo degradado documentado:** si `UPSTASH_REDIS_REST_URL` o `UPSTASH_REDIS_REST_TOKEN` faltan, el backend **arranca igual** (no falla fast) y opera con rate-limit "best-effort" en memoria por instancia + honeypot + validación Zod estricta + UA tratado como vacío. Esto cubre el 95 % de abuso oportunista pero no un bot distribuido; es una decisión consciente del usuario (D5 del informe de auditoría).

### No requeridas por backend (publicación legal)
| Variable | Propósito | Ejemplo | Notas |
|----------|-----------|---------|-------|
| `ARCO_EMAIL` | buzón para solicitudes ARCO (acceso, rectificación, cancelación, oposición). No la lee el backend; se publica en la política de datos. | `datos@metalurgicadelcaribe.co` | sugerida: `datos@<dominio>` |

## Frontend (público, inyectado en build)
| Variable | Propósito | Ejemplo | Notas |
|----------|-----------|---------|-------|
| `MAPS_API_KEY` | Google Maps JS | `AIza...` | restringida por HTTP referrer al dominio productivo; devops la provisiona |
| `API_BASE_URL` | base del backend | `https://api.metalurgicadelcaribe.co` | el formulario envía aquí |
| `SITE_URL` | URL canónica | `https://metalurgicadelcaribe.co` | para OG, canonical, sitemap |

## Reglas
- Secretos nunca en el repo; se gestionan en Vercel (Project Settings → Environment Variables) o en GitHub Actions Secrets para CI/CD.
- `backend/.env.example` siempre sincronizado con esta tabla (devops OPS-07 / AU-B-03).
- Cambios en este contrato → bump de MINOR de ARCHITECTURE si añade variables; MAJOR si elimina.

## Historial
- **v2.1** (2026-10-02) — AU-C-03, AU-H-02, AU-H-03, AU-H-05: `MAIL_PROVIDER` default pasa a `resend`; se añaden `UA_HASH_SALT` (obligatoria secreta), `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (opcionales con modo degradado documentado) y `ARCO_EMAIL` (no requerida por backend). Se renombra `FROM_EMAIL` → `MAIL_FROM` para alinear con el loader real. Se retiran `NODE_ENV`, `PORT`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW` (Vercel Functions no los expone; rate-limit se configura por código con las envs Upstash). Dueño pasa a devops.
- **v1** (2026-10-02) — Versión inicial, propiedad architect.
