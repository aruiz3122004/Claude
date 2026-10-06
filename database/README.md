# database/ — Metalúrgica del Caribe

Capa de persistencia de cotizaciones. Dos drivers intercambiables por env `DB_DRIVER`.

## Instalación

```bash
cd database
npm install
```

Node >= 20.

## Driver `sheets` (default, producción)

### Pre-requisitos
1. El dueño crea un Spreadsheet nuevo en su cuenta Gmail (ej. `metalurgica-cotizaciones`).
2. Dentro del Spreadsheet, renombrar la primera pestaña a `quotes`.
3. En GCP, crear un Service Account con rol mínimo (ninguno a nivel proyecto). Descargar JSON.
4. Compartir el Spreadsheet con el `client_email` del Service Account (permiso de edición). **Solo con ese correo, no con "cualquiera con el link".**
5. Habilitar 2FA en la cuenta Gmail del dueño (llave física o Authenticator; no SMS).

### Variables requeridas
```
DB_DRIVER=sheets
SHEET_ID=[PENDIENTE_USUARIO]
SHEET_TAB=quotes
GOOGLE_SA_JSON={"type":"service_account",...}   # JSON en una línea
```

### Inicializar la hoja (headers)
```bash
npm run seed:headers
```
Idempotente: si la fila 1 ya tiene los headers correctos, no hace nada. Si tiene otros valores, aborta.

## Driver `excel` (desarrollo o fallback)

```
DB_DRIVER=excel
EXCEL_PATH=./data/quotes.xlsx
```
El archivo se crea en el primer `append` si no existe, con la fila de headers. Append atómico con `proper-lockfile`.

## Cambiar de driver
Basta con cambiar la variable `DB_DRIVER` y las credenciales asociadas. El backend consume `getQuoteRepository()` del paquete.

## Rotar credencial del Service Account
1. En GCP > IAM > Service Accounts > seleccionar la cuenta > Keys > Add key > JSON.
2. Actualizar `GOOGLE_SA_JSON` en el PaaS (Render/Fly/Railway).
3. Esperar que el deploy aplique.
4. En GCP eliminar la key anterior.
5. Verificar `GET /readyz` del backend.

Cadencia recomendada: anual, o inmediatamente ante sospecha de compromiso.

## Backup
Export semanal (idealmente diario; ver PLAN §9 y §12 delta 3) a Drive, operado por devops (OPS-06).

## Anonimización trimestral (CMP-04 — Ley 1581)

Job manual trimestral que redacta columnas C/D/E/K/L (`nombre`, `telefono`, `email`, `ip_hash`, `user_agent_hash`) a `***` para las filas con edad efectiva `MAX(timestamp, ultimo_contacto)` > 24 meses.

### Flujo obligatorio (dos pasos)

1. **Simulación**. Genera `anonymize-log-YYYY-MM-DD.csv` y no toca la hoja.
   ```bash
   npm run anonymize -- --dry-run
   ```
   Revisar el CSV con governance. Las acciones posibles por fila son `redact`, `skip-recent`, `skip-already-anon`, `skip-invalid-date`.

2. **Aplicar** (solo tras confirmación del dueño + governance):
   ```bash
   npm run anonymize -- --dry-run --apply
   ```
   El flag `--apply` **requiere** `--dry-run` presente, como salvaguarda frente a ejecuciones accidentales. El script usa `batchUpdate` → 1 llamada a Sheets API.

### Garantías

- **Idempotente:** filas donde C/D/E/K/L ya son `***` se saltan (`skip-already-anon`).
- **Sin PII en logs:** el CSV guarda `row_number`, `id` (ULID público), `effective_date`, `action`, `reason`. **Nunca** se escribe nombre, teléfono, email ni hash en el log.
- **Conserva** A `id`, B `timestamp`, F `servicio`, G `mensaje`, H `origen`, I `consentimiento`, J `consentimiento_version`, M `ultimo_contacto`.

## Estructura

```
database/
  PLAN.md
  README.md
  package.json
  tsconfig.json
  schema/
    quotes.sheet.md
  src/
    repositories/
      QuoteRepository.ts        # interfaz + Quote + createQuote
      GoogleSheetsRepository.ts
      ExcelFileRepository.ts
      index.ts                  # factory getQuoteRepository()
  scripts/
    seed-headers.ts
    anonymize.ts
```
