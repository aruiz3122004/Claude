# Asignaciones — auditoría 2026-10-02

Una línea por acción. Agrupado por agente propietario. ID = hallazgo del `REPORT-2026-10-02.md`.

## architect

- [architect] AU-C-01: bump `docs/contracts/data-model.md` a v2 — columna L pasa de `user_agent` (string truncado 200) a `user_agent_hash` (SHA-256 hex 64).
- [architect] AU-C-02: actualizar `docs/contracts/api.openapi.yaml` — rutas `/healthz` y `/readyz` → `/api/healthz` y `/api/readyz`; sincronizar response schemas.
- [architect] AU-C-03: bump `docs/contracts/env.md` — `MAIL_PROVIDER` default `resend`; añadir `UA_HASH_SALT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ARCO_EMAIL`.
- [architect] AU-H-02: incluir `UA_HASH_SALT` como secreta obligatoria en `env.md`.
- [architect] AU-H-03: incluir `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` como opcionales (modo degradado documentado) en `env.md`.
- [architect] AU-H-05: añadir `ARCO_EMAIL` en `env.md` (no requerida por backend, publicada en política).
- [architect] AU-M-04: tras cerrar AU-C-01, sincronizar OpenAPI body/response con el nuevo schema.
- [architect] AU-M-05: documentar en ARCH §13 (riesgos) la ausencia de cola JSONL BE-06 en Vercel y su mitigación (reintentos + 503 al cliente).
- [architect] bump ARCH v2.0 → v2.1 reflejando los deltas 1..5 del §5 del informe (hosting Vercel, hash UA, backup diario, rutas /api/*, MAIL_PROVIDER=resend).

## database

- [database] AU-C-01: ajustar `database/schema/quotes.sheet.md` nota de delta y confirmar que la hoja real tiene header `user_agent_hash` en L1.
- [database] AU-M-01: entregar script de anonimización trimestral (`scripts/anonymize.ts`) que reemplace C/D/E/K/L por `***` para filas con `timestamp` < hoy-24m.
- [database] §5 contradicción 3: añadir columna M `ultimo_contacto` (ISO UTC opcional) al schema y a `createQuote`/`appendQuote`; actualizar `data-model.md` via architect.
- [database] AU-M-07 (apoyo): preparar export auditable del Sheet para el proceso RNBD cuando el usuario resuelva D3.

## backend

- [backend] AU-H-02: verificar que el loader de env falla fast si `UA_HASH_SALT` no está presente (una vez architect la añada al contrato).
- [backend] AU-C-02: añadir handlers `api/healthz.ts` y `api/readyz.ts` ya existen; confirmar que respetan el response schema del OpenAPI tras AU-C-02.
- [backend] AU-M-06 (apoyo): aceptar en Zod las mismas limpiezas que el frontend aplica (ya lo hace vía `transform`); no requiere cambio.
- [backend] §3 MISMATCH `nombre` 120 vs 80: decidir con architect — mantener 120 en Zod y bump data-model.md columna C a 2..120, O recortar Zod a 2..80. Recomendación: subir hoja a 120 (menos destructivo).

## devops

- [devops] AU-H-01: cambiar cron de backup `sheet-backup.yml` de semanal (`0 3 * * 0`) a diario (`0 3 * * *`) para cumplir RPO 24 h; retención sugerida 30 d diarios + 52 w semanales.
- [devops] AU-C-02: actualizar monitores UptimeRobot a `/api/healthz` y `/api/readyz`.
- [devops] AU-H-04: definir `CORS_ORIGIN` real cuando el usuario entregue D1 (dominio).
- [devops] AU-B-03: mantener `backend/.env.example` sincronizado con `env.md` tras las adiciones del architect.
- [devops] AU-B-04: tras adquirir dominio, configurar SPF/DKIM/DMARC para Resend y verificar con `dig`.
- [devops] AU-B-05: añadir job `e2e` al `ci.yml` con matriz `{chromium, firefox, webkit}`; arranque de `vercel dev` en background y ejecución Playwright.
- [devops] §8 preparación E2E: documentar en runbook cómo correr Playwright local y en CI; proveer env `TEST_MODE=1` para driver in-memory.

## governance

- [governance] AU-C-01 (apoyo): actualizar `governance/legal/politica-tratamiento-datos.md` para reflejar `user_agent_hash` en lugar de `user_agent` truncado (tras bump del architect).
- [governance] AU-H-05: confirmar valor literal de `ARCO_EMAIL` (sugerencia `datos@metalurgicadelcaribe.co`) y bloquear MIT hasta que el usuario cree la cuenta.
- [governance] AU-M-01 (apoyo): aprobar formato del log de anonimización y añadirlo a la plantilla trimestral del §4.
- [governance] AU-M-02: documentar explícitamente en `retencion-y-borrado.md` que la retención se mide desde `MAX(timestamp, ultimo_contacto)` cuando `ultimo_contacto` exista.
- [governance] AU-M-07: dar entrada al usuario para resolver RNBD (Q1, Q3, Q6) y marcar CMP-08 según respuesta.
- [governance] AU-H-06: definir si `localStorage['maps_consent']` debe guardar la versión (`'2026-10-02'`) o un booleano/texto (`'accepted'`). Recomendación de audit: guardar la versión para poder invalidar al cambiar política.

## frontend

- [frontend] AU-H-06: cambiar `localStorage['maps_consent']` de `'accepted'` a `CONFIG.CONSENT_VERSION` (invalidación automática al cambiar versión).
- [frontend] AU-M-03: aclarar en `frontend/PLAN.md §9` que el honeypot solo se valida en servidor; eliminar la ambigüedad del wording actual.
- [frontend] AU-M-06: alinear el chequeo cliente del `telefono` para aceptar la misma entrada permisiva que el backend normaliza (espacios, guiones, paréntesis).
- [frontend] AU-B-01: generar `og-cover.jpg` (1200x630) y publicarlo en `public/`.
- [frontend] AU-B-02: tras D6 del usuario, actualizar coordenadas geo del JSON-LD y el `q=` del embed del mapa.
- [frontend] §8 preparación E2E: añadir `data-testid` a: `#f-form-submit`, `#consentCheckbox`, `#formFeedback`, `#consentModal`, `#mapShowBtn`.
- [frontend] §4 Ley 1581 pendiente: publicar render de `politica-privacidad.html` desde `governance/legal/politica-tratamiento-datos.md` (coordinación con devops para la ruta canónica).

## usuario (decisiones requeridas, no son asignaciones de agente)

- D1 dominio final + preview · D2 ARCO_EMAIL · D3 forma societaria + activos (RNBD) · D4 representante + NIT + dirección · D5 Upstash sí/no · D6 MAPS_API_KEY + coordenadas · D7 cuenta Gmail con 2FA · D8 Vercel Hobby/Pro · D9 email alertas.
