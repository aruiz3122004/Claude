# Contrato de datos v2

Dueño: database (a partir de v2). Última modificación: 2026-10-02.

## Entidad única: `Quote`

Persistida en una hoja de Google Sheets llamada **`quotes`** dentro del Spreadsheet identificado por `SHEET_ID`.

### Esquema de columnas (orden importa)
| # | Columna header | Tipo | Formato | Reglas |
|---|----------------|------|---------|--------|
| A | `id` | string | ULID (26 chars) | único, generado por backend |
| B | `timestamp` | string | ISO 8601 UTC `YYYY-MM-DDTHH:mm:ss.sssZ` | generado por backend |
| C | `nombre` | string | 2..120 | trimmed |
| D | `telefono` | string | normalizado (dígitos y `+`) | 7..15 |
| E | `email` | string | RFC 5322 | lowercased |
| F | `servicio` | string | enum | `residencial \| comercial \| industrial \| portones \| barandas \| mobiliario \| otro` |
| G | `mensaje` | string | 10..2000 | se escapan saltos de línea para una celda |
| H | `origen` | string | libre | default `web-landing` |
| I | `consentimiento` | bool | `TRUE` | siempre TRUE (si no, el request no llega aquí) |
| J | `consentimiento_version` | string | `YYYY-MM-DD` | del valor de env `CONSENT_VERSION` |
| K | `ip_hash` | string | hex SHA-256 (64) | `SHA-256(ip + IP_HASH_SALT)`, para antiabuso sin guardar IP |
| L | `user_agent_hash` | string | hex SHA-256 (64) | `SHA-256(ua + UA_HASH_SALT)`. Minimización Ley 1581 art. 4 lit. e); el UA en claro no aporta valor al responsable. |
| M | `ultimo_contacto` | string | ISO 8601 UTC, opcional | puede estar vacía; se actualiza manualmente cuando el dueño atiende la cotización. Ver "Backups y retención". |

### Relaciones y cardinalidad
No hay relaciones; es una sola entidad plana. Cada envío = 1 fila.

### Convenciones de nombres
- Los nombres de campos JSON del API deben coincidir **literalmente** con los nombres de columna (snake_case en minúsculas). Esto evita mapeos divergentes entre frontend, backend y hoja.
- Excepción: `user_agent_hash` y `ultimo_contacto` **no se exponen** en la API pública (`QuoteInput` del OpenAPI); los calcula/mantiene el backend o el dueño directamente en la hoja.

### Backups y retención
- Export **diario** del Spreadsheet a Drive en formato `.xlsx` (devops cron `0 3 * * *` UTC).
- Retención de backups: 30 días diarios + 52 semanas semanales.
- Retención de datos de la cotización: 24 meses contados desde `MAX(timestamp, ultimo_contacto)`. Si `ultimo_contacto` está vacío, el reloj corre desde `timestamp`.
- A partir del mes 25, el job trimestral de anonimización (`scripts/anonymize.ts`, DB-04) reemplaza C/D/E/K/L por `***` manteniendo A/B/F/G/H/I/J/M para analítica agregada.

### Driver alterno `excel`
- Archivo `.xlsx` en OneDrive o disco local del servidor.
- Mismo orden de columnas y mismos tipos (A..M).
- Se usa cuando `DB_DRIVER=excel`.

### Cuotas y latencias (Google Sheets API v4)
- 300 req/min/project, 60 req/min/usuario. Para el volumen esperado (< 1 k/mes) sobra.
- Latencia típica `values.append`: 300–900 ms.
- Si la latencia excede 2 s dos veces seguidas, backend reintenta y, al tercer fallo, responde `503` al cliente (la cola JSONL local no aplica en entorno serverless Vercel; ver ARCHITECTURE §13 R-08).

## Historial de cambios
- **v2** (2026-10-02) — Tras auditoría de cierre (AU-C-01, AU-H-02, AU-M-08, §5 decisiones):
  - Columna L: `user_agent` (string truncado 200) → `user_agent_hash` (SHA-256 hex 64 con `UA_HASH_SALT`).
  - Columna C `nombre`: longitud máxima 80 → 120 (alinear con Zod del backend y frontend).
  - Añadida columna M `ultimo_contacto` (ISO 8601 UTC, opcional); la retención se mide desde `MAX(timestamp, ultimo_contacto)`.
  - Backups: periodicidad semanal → diaria; retención 30 d diarios + 52 w semanales.
  - Dueño del contrato pasa de architect a database.
- **v1** (2026-10-02) — Versión inicial del contrato, propiedad architect.
