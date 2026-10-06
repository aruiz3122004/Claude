# SETUP — Metalúrgica del Caribe

Checklist único de puesta en producción. Marca cada paso al cerrarlo. El orden importa: cada paso desbloquea el siguiente.

---

## Fase 0 — Decisiones (sin estas, el resto se detiene)

- [ ] **D1 · Dominio final.** Comprar o decidir el dominio público. Default: `metalurgicadelcaribe.co`. Sin esto no se cierran CORS, canonical, OG, sitemap, verificación de Resend ni restricción de Maps.
- [ ] **D3 · Forma societaria + activos año fiscal anterior.** Confirmar con contador si la empresa supera 100.000 UVT (umbral RNBD, Resolución SIC 76434/2018). Si sí → inscribir base ante SIC. Si no → documentar la decisión.
- [ ] **D4 · Datos corporativos.** Razón social, NIT, representante legal (nombre + cédula), dirección de facturación. Solo para los documentos legales, nunca en el sitio.
- [ ] **D5 · Rate-limit.** Elegir: (a) Upstash Redis free tier → protección real contra bots; (b) modo degradado → honeypot + Zod + UA vacío. Para <10 cotizaciones/día, (b) es aceptable.
- [ ] **D8 · Plan Vercel.** Hobby (free, timeout 10 s, suficiente) o Pro (timeout 60 s, dominios custom más fáciles).

---

## Fase 1 — Infraestructura externa (cuentas y claves)

### 1.1 Google (base de datos)

- [ ] Confirmar que la cuenta Gmail del dueño tiene **2FA activo** (D7).
- [ ] Crear hoja en Google Sheets llamada `Cotizaciones Metalúrgica`.
- [ ] Nombrar la pestaña `quotes` (nombre exacto, en minúsculas).
- [ ] Crear proyecto en Google Cloud Console (`console.cloud.google.com`).
- [ ] Habilitar **Google Sheets API** en el proyecto.
- [ ] Crear **Service Account** → generar llave JSON → descargar.
- [ ] Compartir la hoja con el `client_email` del service account (permiso **Editor**).
- [ ] Copiar el `SHEET_ID` desde la URL de la hoja (`https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).

### 1.2 Resend (correo)

- [ ] Crear cuenta en `resend.com`.
- [ ] Añadir dominio (D1) → copiar los registros DNS que Resend genera.
- [ ] Pegar los registros en el DNS del dominio (SPF, DKIM, DMARC). Checklist en `devops/dns/README.md`.
- [ ] Esperar propagación DNS (`dig TXT <dominio>` para verificar).
- [ ] Verificar el dominio en el panel de Resend.
- [ ] Generar `RESEND_API_KEY`.
- [ ] Crear cuenta `datos@<dominio>` para `ARCO_EMAIL` (D2).

### 1.3 Google Maps (D6)

- [ ] En el mismo proyecto de Google Cloud, habilitar **Maps Embed API**.
- [ ] Crear API key → restringir por **HTTP referrer** a `*.<dominio>/*` y `*.vercel.app/*`.
- [ ] Establecer cuota diaria baja (1.000 req/día) para evitar bill shock.
- [ ] Obtener coordenadas exactas de Vía 40 #73-125, Barranquilla (Google Maps → clic derecho → copiar lat/lng). Hoy el sitio usa aproximación `10.9878, -74.7889`.

### 1.4 Upstash (opcional, solo si D5=a)

- [ ] Crear cuenta en `upstash.com`.
- [ ] Crear base Redis free tier (región cercana a Vercel edge).
- [ ] Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

### 1.5 UptimeRobot (D9)

- [ ] Crear cuenta en `uptimerobot.com`.
- [ ] Añadir monitor HTTP(S) → `https://<dominio>/api/healthz` cada 5 min.
- [ ] Añadir monitor HTTP(S) → `https://<dominio>/api/readyz` cada 5 min.
- [ ] Configurar email de alerta.

---

## Fase 2 — Semilla de la base

- [ ] Clonar el repo localmente, `npm install` desde la raíz.
- [ ] Crear `.env` local a partir de `.env.example`, rellenar todo con los valores de Fase 1.
- [ ] Ejecutar `npm run -w database seed` (corre `scripts/seed-headers.ts`) → escribe la fila de 13 headers en la hoja.
- [ ] Abrir el Sheet y verificar que la fila 1 tiene: `id, timestamp, nombre, telefono, email, servicio, mensaje, origen, consentimiento, consentimiento_version, ip_hash, user_agent_hash, ultimo_contacto`.
- [ ] (Opcional) Insertar una fila dummy para probar que el filtrado por fecha funciona.

---

## Fase 3 — Repositorio Vercel

- [ ] Conectar el repo a Vercel (`vercel.com/new` → import GitHub).
- [ ] En **Project Settings → Environment Variables**, crear todas las envs listadas en `.env.example`. Separar por entorno: `Production` y `Preview`.
  - `MAIL_PROVIDER=resend`
  - `RESEND_API_KEY=…`
  - `MAIL_FROM=cotizaciones@<dominio>`
  - `OWNER_EMAIL=<correo del dueño que recibirá leads>`
  - `ARCO_EMAIL=datos@<dominio>`
  - `DB_DRIVER=sheets`
  - `GOOGLE_SA_JSON=<pegar el JSON del service account en una sola línea>`
  - `SHEET_ID=…`
  - `IP_HASH_SALT=<generar 32 bytes random>`
  - `UA_HASH_SALT=<generar 32 bytes random, distinto del anterior>`
  - `CORS_ORIGIN=https://<dominio>,https://*.vercel.app`
  - `MAPS_API_KEY=…`
  - `LOG_LEVEL=info`
  - (Si D5=a) `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] En **Project Settings → Domains**, añadir el dominio de D1 y seguir las instrucciones de DNS.
- [ ] Hacer el primer deploy (push a `main` o manual).
- [ ] Verificar `/api/healthz` responde 200 y `/api/readyz` responde 200 con `{sheets: true, mail: true}`.

---

## Fase 4 — Rellenar placeholders

Buscar `[PENDIENTE_USUARIO:` en el repo y rellenar:

- [ ] `governance/legal/politica-tratamiento-datos.md` → razón social, NIT, representante, teléfono, ARCO_EMAIL.
- [ ] `governance/legal/aviso-privacidad.md` → mismo set reducido.
- [ ] `frontend/politica-privacidad.html` → mismos valores (coinciden con el markdown).
- [ ] `frontend/public/robots.txt` → `Sitemap: https://<dominio>/sitemap.xml`.
- [ ] `frontend/public/sitemap.xml` → URLs con dominio real.
- [ ] `frontend/index.html` → `og:url` y canonical absolutos; JSON-LD con coordenadas exactas de D6.
- [ ] `vercel.json` → `Access-Control-Allow-Origin` con dominio real.
- [ ] `devops/dns/README.md` → DKIM selector + clave pública reales de Resend.

Verificación rápida:

```powershell
Get-ChildItem -Recurse -Include *.md,*.html,*.yaml,*.json,*.xml | Select-String "PENDIENTE_USUARIO"
```

Debería devolver 0 resultados cuando todo esté rellenado.

---

## Fase 5 — Pruebas en producción

- [ ] Abrir `https://<dominio>` → ver la landing.
- [ ] Enviar una cotización de prueba.
- [ ] Verificar que llega al Sheet (fila nueva al final).
- [ ] Verificar que llega el correo al `OWNER_EMAIL`.
- [ ] Activar el mapa → aceptar consentimiento → ver que Maps carga.
- [ ] Abrir Lighthouse → verificar Core Web Vitals (LCP < 2.5 s, INP < 200 ms, CLS < 0.1).
- [ ] Confirmar que UptimeRobot reporta ambos endpoints como UP.
- [ ] Confirmar que GitHub Actions corrió el primer backup diario (revisar carpeta `backups/`).

---

## Fase 6 — Operación continua

Rutinas que corren solas una vez montado:

- Backup diario del Sheet (`.github/workflows/sheet-backup.yml`, cron `0 3 * * *` UTC).
- CI en cada PR (`.github/workflows/ci.yml`): lint + typecheck + tests.
- Deploy automático en Vercel ante push a `main`.

Rutinas manuales:

- **Trimestral** · correr `database/scripts/anonymize.ts --dry-run` → revisar CSV → correr con `--apply --dry-run`.
- **Trimestral** · revisar accesos al Sheet (Google Workspace → actividad).
- **Anual** · revisión de la política de datos con abogado.
- **Al responder una cotización** · marcar `ultimo_contacto` vía `repo.touch(id)` (hoy manual; en el futuro podría exponerse como mini-admin).

---

## Pendientes técnicos no bloqueantes

- Suite Playwright: los `data-testid` ya están en el HTML; falta escribir los specs y el job `e2e` del CI ya está preparado (devops lo dejó condicional).
- Fotos propias del taller para reemplazar Unsplash en secciones 01/02/03.
- Revisión legal profesional de la política antes de la publicación oficial.
- Mini-admin para marcar `ultimo_contacto` desde una UI (hoy requiere llamar el método del repo manualmente).

---

## Referencias

- Arquitectura: `docs/ARCHITECTURE.md` v2.1
- Contratos: `docs/contracts/{api.openapi.yaml, data-model.md, env.md}`
- Auditoría de cierre: `audit/REPORT-2026-10-02.md` + `audit/ASSIGNMENTS-2026-10-02.md`
- Legal: `governance/legal/*.md`
- Operación backend: `backend/README.md`
- Operación database: `database/README.md`
- Operación devops: `devops/PLAN.md`
