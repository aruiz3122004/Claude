# Política operativa de retención y borrado

> **BORRADOR PARA REVISIÓN LEGAL.** Documento interno.

**Versión:** 1.1 — 2 de octubre de 2026

---

## 1. Período de retención

**24 meses contados desde el último contacto con el Titular.**

Se entiende por "último contacto":
- La fecha de envío del formulario (columna B `timestamp`), si no hubo intercambio posterior.
- La fecha del último correo, llamada o WhatsApp posterior, si la hubo. Se registra en la columna M `ultimo_contacto` (ISO UTC opcional), confirmada por la auditoría R2 e incorporada al schema de la hoja.

**Regla operativa (AU-M-02).** La retención se mide desde `MAX(timestamp, ultimo_contacto)`. Transcurridos 24 meses sin contacto adicional, la fila entra en el proceso de anonimización trimestral descrito en §4 (bitácora) y §3 (procedimiento). Si `ultimo_contacto` está vacío, el reloj corre desde `timestamp`.

Transcurridos 24 meses, se procede a **anonimización** (preferida) o **supresión** total, según el caso.

---

## 2. Qué se anonimiza y qué se conserva

Siguiendo el contrato de datos (sección "Backups y retención" de `docs/contracts/data-model.md`):

| Columna | Acción al mes 25 |
|---|---|
| A `id` | Conservar (clave lógica) |
| B `timestamp` | Conservar (truncar al mes para analítica) |
| C `nombre` | Reemplazar por `***` |
| D `telefono` | Reemplazar por `***` |
| E `email` | Reemplazar por `***` |
| F `servicio` | Conservar (dato de preferencia, no identificativo) |
| G `mensaje` | Reemplazar por `***` (puede contener dirección del inmueble) |
| H `origen` | Conservar |
| I `consentimiento` | Conservar (TRUE) |
| J `consentimiento_version` | Conservar |
| K `ip_hash` | Reemplazar por `***` |
| L `user_agent_hash` | Reemplazar por `***` |
| M `ultimo_contacto` | Conservar truncado al mes (dato operativo, no identificativo) |

**Supresión total** (en lugar de anonimización) procede cuando:
- El Titular lo solicitó expresamente antes del vencimiento.
- El Titular ejerció revocación u oposición.
- No existe interés estadístico identificable (filas con `servicio = otro` y sin seguimiento).

---

## 3. Procedimiento operativo

### 3.1. Barrido bimestral

El dueño ejecuta cada **dos meses** el siguiente procedimiento:

1. Abrir el Sheet `quotes`.
2. Filtrar filas con `timestamp` ≥ 24 meses y bandera de "último contacto" vacía o también ≥ 24 meses.
3. Para cada fila, aplicar la transformación de la tabla anterior.
4. Registrar en la bitácora:

```
fecha_barrido, filas_encontradas, filas_anonimizadas, filas_suprimidas, operador
```

### 3.2. Script asistente — herramienta operativa

La herramienta operativa es **`database/scripts/anonymize.ts`**, entregada por el agente database en R2 (AU-M-01). Comportamiento:

- Identifica filas candidatas aplicando la regla `MAX(timestamp, ultimo_contacto) < hoy - 24 meses`.
- Reemplaza las columnas C, D, E, G, K, L por `***` conforme a la tabla de §2.
- Genera un **CSV de salida auditable** con el detalle de filas tocadas (id, fecha original, acción).
- Debe ejecutarse con confirmación explícita del operador (no autorun).

**Archivo de auditoría trimestral.** El CSV de salida se archiva en `governance/compliance/anonimizacion/YYYY-Qn.csv` como evidencia ante la SIC del cumplimiento del principio de retención limitada. Se conserva por el término general documental de la Empresa.

Este diseño evita destrucción accidental y produce trazabilidad legal.

### 3.3. Borrado por solicitud ARCO

Cuando el Titular pide supresión (ver `protocolo-arco.md`):

1. Localizar las filas del Titular.
2. Reemplazar los campos de la tabla por `***` (o eliminar la fila completa si así lo pidió).
3. Confirmar al Titular en la respuesta ARCO.
4. Dejar constancia en la bitácora de retención.

### 3.4. Backups

Los backups semanales (OPS-06, formato `.xlsx` en Drive) **también envejecen**. Al mes 25, el dueño debe:
- Mantener máximo los 12 backups más recientes.
- Suprimir backups de más de 24 meses de antigüedad (contienen datos no anonimizados).

---

## 4. Bitácora de retención

Archivo: `governance/compliance/bitacora-retencion.csv` (se crea al primer barrido).

Columnas:
```
fecha, tipo (barrido/arco), filas_anonimizadas, filas_suprimidas, backups_borrados, operador, observaciones
```

Esta bitácora es prueba ante la SIC de cumplimiento del principio de retención limitada.

---

## 5. Excepciones

- **Litigio o requerimiento judicial.** Si un dato está siendo objeto de un proceso o un requerimiento formal, se **suspende el borrado** sobre esas filas y se documenta el motivo con fecha del requerimiento.
- **Contrato en ejecución.** Si el Titular contrató el servicio, su información puede conservarse por el término comercial contractual (p. ej., garantía del trabajo entregado), con base legal distinta a la autorización. Documentar en la bitácora.

---

## 6. Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-02 | Versión inicial. |
| 1.1 | 2026-10-02 | Se formaliza la regla `MAX(timestamp, ultimo_contacto)` (AU-M-02). Se documenta `database/scripts/anonymize.ts` como herramienta operativa y el archivo trimestral del CSV de salida. Se añade la columna M `ultimo_contacto` a la tabla de anonimización. |

---

## 7. Revisión de esta política

Esta política se revisa en la revisión anual (octubre de cada año) junto con la Política de Tratamiento. El resultado puede ampliar o reducir el plazo de 24 meses si el negocio lo justifica, siempre bajo el principio de "no más tiempo del necesario para la finalidad".
