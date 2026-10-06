# ADR-002 — Persistencia primaria en Google Sheets

Fecha: 2026-10-02
Estado: aceptado (con reservas documentadas)

## Contexto
El usuario pidió **ver las cotizaciones en Google Sheets o Excel**, no en una base de datos. Es una petición explícita de producto, no una decisión técnica negociable.

## Decisión
- Persistencia primaria: **Google Sheets** via Sheets API v4 con **Service Account**.
- Alternativa pluggable: **Excel .xlsx** (local u OneDrive), activada por `DB_DRIVER=excel`.
- La capa `QuoteRepository` aísla la implementación; migrar a PostgreSQL en el futuro no afecta al dominio.

## Alternativas descartadas
- **PostgreSQL** — técnicamente correcto para datos relacionales multiusuario, pero contradice la petición explícita del usuario. Se documenta como camino de migración (ADR-003 reservado).
- **Firebase/Firestore** — añade un vendor nuevo sin que el usuario pueda "ver" los datos cómodamente.
- **Airtable** — más amigable que Sheets pero no fue pedido y tiene costo.

## Consecuencias
- + El dueño ve y edita los datos directamente desde el navegador.
- + Backup y export triviales (Drive).
- + Cero costo de DB.
- − No es transaccional; concurrencia alta puede colisionar (irrelevante en < 1 k/mes).
- − Latencia 300–900 ms por escritura (vs <10 ms en Postgres).
- − Cuotas de API (300 req/min). Se vigila con métricas.
- − No apto para > 100 k cotizaciones; se migra cuando corresponda (ver ADR-003 futuro).

## Mitigaciones
- OAuth tipo **Service Account** (sin consentimiento interactivo), con permiso solo sobre el Spreadsheet objetivo.
- Reintento con backoff ante 5xx/429.
- Cola local JSONL ante fallo persistente para no perder datos.
