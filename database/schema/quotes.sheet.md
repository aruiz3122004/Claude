# Schema físico — hoja `quotes` (v2)

Primera fila (A1:M1) del Spreadsheet. Orden exacto, sin espacios, snake_case.

| Celda | Columna | Header literal | Tipo lógico | Formato | Validación en celda |
|-------|---------|----------------|-------------|---------|---------------------|
| A1 | A | `id` | string | ULID 26 chars | ninguna (confianza en backend) |
| B1 | B | `timestamp` | string | ISO-8601 UTC | ninguna (texto literal, no fecha de Sheets) |
| C1 | C | `nombre` | string | 2..120 | longitud |
| D1 | D | `telefono` | string | 7..15, dígitos y `+` | regex `^\+?[0-9]{7,15}$` |
| E1 | E | `email` | string | RFC 5322, lowercase | regex email |
| F1 | F | `servicio` | string | enum | lista desplegable: `residencial`, `comercial`, `industrial`, `portones`, `barandas`, `mobiliario`, `otro` |
| G1 | G | `mensaje` | string | 10..2000, saltos escapados | longitud |
| H1 | H | `origen` | string | libre, default `web-landing` | ninguna |
| I1 | I | `consentimiento` | bool | `TRUE` siempre | checkbox; rechazar `FALSE` |
| J1 | J | `consentimiento_version` | string | `YYYY-MM-DD` | regex `^\d{4}-\d{2}-\d{2}$` |
| K1 | K | `ip_hash` | string | SHA-256 hex (64) | regex `^[a-f0-9]{64}$` |
| L1 | L | `user_agent_hash` | string | SHA-256 hex (64) | regex `^[a-f0-9]{64}$` |
| M1 | M | `ultimo_contacto` | string | ISO-8601 UTC opcional, puede quedar vacío | ninguna (texto plano) |

**Nota (resuelto en v2):** la columna L `user_agent_hash` queda confirmada tanto en el contrato `docs/contracts/data-model.md` v2 como en el código (hallazgo AU-C-01 cerrado). El delta documental v1 queda archivado.

**Nota columna C (resuelto en v2):** longitud máxima sube de 80 a **120** para alinear con el schema Zod del backend y el `maxlength=120` del formulario (hallazgo AU-M-08 cerrado).

**Nota columna M (nuevo en v2):** `ultimo_contacto` lo escribe el backend (o un script interno) cuando se registra contacto con el prospecto. Al crear la cotización inicial queda **vacío** (string `""`). La retención a 24 meses se mide como `MAX(timestamp, ultimo_contacto)` (ver §4 compliance y §10 PLAN).

## Bloque CSV (copiar y pegar en A1)

```csv
id,timestamp,nombre,telefono,email,servicio,mensaje,origen,consentimiento,consentimiento_version,ip_hash,user_agent_hash,ultimo_contacto
```

## Rango canónico de append

Backend usa el rango `quotes!A:M` con `valueInputOption=RAW` e `insertDataOption=INSERT_ROWS`. **13 columnas.**

## Formato de celdas recomendado

- Columna A..M: formato `Texto plano` (menú Formato > Número > Texto plano). Esto evita que Sheets reinterprete `01HXYZ...` como número o `2026-10-02T...` como fecha.
- Congelar fila 1 (Ver > Congelar > 1 fila).
- Proteger fila 1 (Datos > Proteger hojas y rangos): solo el Service Account puede editarla.

## Historial de cambios

- **v2 — 2026-10-02**
  - Confirmado `user_agent_hash` en L (resolución AU-C-01, delta v1 archivado).
  - Columna C `nombre`: longitud 2..80 → 2..120 (resolución AU-M-08).
  - Añadida columna M `ultimo_contacto` (ISO-8601 UTC opcional) para soportar retención real a 24 meses medida por `MAX(timestamp, ultimo_contacto)` (resolución §5 contradicción 3 y AU-H-02 / AU-M-01).
  - Rango de append migra de `quotes!A:L` a `quotes!A:M`.
- **v1 — 2026-10-02**
  - Esquema inicial 12 columnas (A..L).
