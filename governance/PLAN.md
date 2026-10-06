version: 1.1 | fecha: 2026-10-02 | arq_leída: 2.0 | estado: completo (post-R2)

# governance/PLAN.md — Metalúrgica del Caribe

> **Aviso.** Este documento y los archivos de `governance/legal/` son borradores de trabajo preparados por el responsable de cumplimiento del proyecto. **No sustituyen asesoría legal.** Antes de publicar o firmar, deben ser revisados por un abogado habilitado en Colombia.

---

## 1. Marco legal aplicable y por qué

| Norma | Aplica porque |
|---|---|
| **Ley 1581 de 2012** (Régimen general de protección de datos personales) | La empresa es Responsable del Tratamiento de datos personales recolectados en territorio colombiano por el formulario del sitio. |
| **Decreto 1377 de 2013** (reglamentario de la Ley 1581) | Fija requisitos de autorización, aviso de privacidad, política de tratamiento y procedimientos ARCO. |
| **Decreto 886 de 2014** y **Circular Externa 002 de 2015 SIC** | Regulan el Registro Nacional de Bases de Datos (RNBD). |
| **Resolución SIC 76434 de 2018** (y Circular 003 de 2018) | Exime del RNBD a sociedades con activos totales inferiores a 100.000 UVT. Determina si aplica el registro. |
| **Ley 1480 de 2011** (Estatuto del Consumidor) | Relación con consumidor final (clientes residenciales). |
| **Ley 527 de 1999** | Validez del consentimiento electrónico (checkbox). |

**No aplican en v2:** Ley 1266 de 2008 (datos financieros/crediticios), normativa de datos de niños (el formulario es B2B/B2C de adultos sin recolección de edad), facturación electrónica DIAN en el sitio (no se facturan transacciones aquí).

---

## 2. Mapa de PII: dato → finalidad → base legal

| Campo (ver `docs/contracts/data-model.md`) | Categoría | Finalidad única | Base legal | Retención |
|---|---|---|---|---|
| `nombre` | Dato personal | Identificar al solicitante y dirigirse a él | Consentimiento (Art. 9, Ley 1581) | 24 meses |
| `telefono` | Dato personal | Contacto para entregar cotización | Consentimiento | 24 meses |
| `email` | Dato personal | Contacto para entregar cotización | Consentimiento | 24 meses |
| `servicio` | Dato de preferencia (no sensible) | Clasificar la consulta | Consentimiento | 24 meses |
| `mensaje` | Dato personal (puede contener dirección del inmueble) | Dimensionar la cotización | Consentimiento | 24 meses |
| `consentimiento` / `consentimiento_version` | Metadato de prueba | Acreditar autorización ante la SIC | Obligación legal (Art. 9, Ley 1581 + Art. 5, Dec. 1377) | 24 meses + archivo histórico de prueba |
| `timestamp` | Metadato técnico | Trazabilidad | Interés legítimo operativo | 24 meses |
| `ip_hash` | Metadato técnico (hash salado, no reversible) | Antiabuso / rate-limit | Interés legítimo de seguridad | 24 meses |
| `user_agent_hash` (SHA-256, salado) | Metadato técnico | Diagnóstico de errores y antiabuso | Interés legítimo operativo + minimización (art. 4 lit. e Ley 1581) | 24 meses |
| `ultimo_contacto` | Metadato operativo | Medir retención real desde el último contacto | Interés legítimo operativo | 24 meses desde su propio valor |

**Datos NO recolectados** (minimización): dirección exacta, documento de identidad, fecha de nacimiento, datos sensibles, cookies de analítica (no hay analítica en v2).

**Nota sobre `user_agent` (resuelta en R2 — 2026-10-02).** La auditoría R2 cerró el delta #1 a favor del **hash SHA-256 salado**. El contrato de datos pasa a `user_agent_hash`; la política, el aviso y la bitácora reflejan la minimización. AU-C-01 (apoyo) queda resuelto.

---

## 3. Flujo de derechos del titular (ARCO + Ley 1581)

Ley 1581 reconoce estos derechos (Art. 8):

| Derecho | Qué significa |
|---|---|
| **Conocer** (acceso) | Saber qué datos suyos tenemos. |
| **Actualizar / Rectificar** | Corregir datos inexactos. |
| **Suprimir** (cancelación) | Pedir borrado cuando no haya deber legal de conservarlos. |
| **Revocar la autorización** | Retirar el consentimiento otorgado. |
| **Oposición** | Oponerse al tratamiento. |
| **Acceder gratuitamente** | Al menos una vez al mes. |
| **Presentar queja ante la SIC** | Cuando se violen sus derechos. |

Procedimiento operativo detallado en `governance/legal/protocolo-arco.md`.

**Canal ARCO — decisión governance R2 (2026-10-02).**

- Valor sugerido confirmado: **`datos@<dominio>`** (p. ej. `datos@metalurgicadelcaribe.co` una vez D1 esté resuelto).
- Estado: `[PENDIENTE_USUARIO: ARCO_EMAIL]` hasta que el usuario cree la cuenta y la verifique.
- **MIT-ARCO queda BLOQUEADO** hasta la creación de la cuenta. No se puede publicar la política con un canal inexistente; publicar con placeholder equivaldría a dejar sin canal real a los titulares, lo que vulnera el art. 15 Ley 1581 por imposibilidad de atender reclamos.

Plazos legales (Ley 1581, arts. 14 y 15):
- **Consulta:** 10 días hábiles, prorrogables 5 (máximo 15 total).
- **Reclamo:** 15 días hábiles, prorrogables 8 (máximo 23 total).

---

## 4. Programa de mantenimiento documental

Detalle en `governance/metodologia.md`. Resumen de ritmos:

| Actividad | Frecuencia | Responsable | Evidencia |
|---|---|---|---|
| Revisión integral de la Política de Tratamiento | Anual (cada octubre) | Dueño + abogado | Nueva versión + `CONSENT_VERSION` actualizada |
| Barrido de retención en el Sheet (filas > 24 meses) | Bimestral | Dueño (o script) | Log de filas anonimizadas |
| Revisión del log de accesos del Sheet | Trimestral | Dueño | Captura o export del "Activity Dashboard" de Google |
| Prueba de restauración de backup semanal | Semestral | Dueño | Checklist firmada |
| Bitácora de incidentes de datos | Continua | Dueño | `governance/incidentes/YYYY-MM-DD.md` (crear al ocurrir) |
| Revisión de dependencias de encargados (Google, proveedor de correo) | Anual | Dueño | Nota en bitácora |

Procedimiento de borrado: ver `governance/legal/retencion-y-borrado.md`.

---

## 5. Riesgo abierto: Registro Nacional de Bases de Datos (RNBD)

**Criterio aplicable (Res. SIC 76434/2018 y Circ. 003/2018):**

El RNBD es obligatorio para sociedades (personas jurídicas) y personas naturales comerciantes que:
1. Tengan activos totales superiores a **100.000 UVT** del año anterior, O
2. Sean entidades públicas, O
3. Realicen tratamiento con alcance que la SIC califique de masivo.

**Decisión necesaria:**

| Supuesto | Obligación RNBD |
|---|---|
| Metalúrgica del Caribe es persona natural (comerciante) con activos < 100.000 UVT | **No obligatorio inscribir** la base. Igualmente debe cumplir Ley 1581 en todo lo demás. |
| Es persona jurídica (SAS, Ltda., S.A.) con activos < 100.000 UVT | **No obligatorio** (exención Res. 76434). |
| Es persona jurídica con activos ≥ 100.000 UVT | **Obligatorio** inscribirse en el RNBD (plataforma SIC) y actualizar anualmente. |

**Acción:** [PENDIENTE_USUARIO: forma societaria y rango de activos]. Confirmar con el contador. Independientemente del resultado, los deberes de la Ley 1581 (política, autorización, derechos, seguridad) **sí aplican siempre**.

Prioridad del riesgo: **Media.** La omisión del RNBD cuando es obligatorio puede acarrear multas de la SIC (hasta 2.000 SMLMV).

---

## 6. Riesgo abierto: PII en Google Sheets de cuenta personal (Gmail)

Google LLC actúa como **Encargado del Tratamiento** (en terminología Ley 1581). El Sheet contiene datos personales de titulares colombianos.

**Riesgo:** Si el Sheet está en una cuenta Gmail personal del dueño:
- La contraseña personal es el único control de acceso al conjunto de PII.
- Si la cuenta se compromete, se compromete toda la base.
- No hay separación entre uso personal del dueño y datos de clientes.

**Mitigaciones exigibles (obligatorias antes de producción):**

| ID | Mitigación | Verificable por |
|---|---|---|
| MIT-01 | 2FA (verificación en dos pasos) obligatoria en la cuenta Google del dueño, con app autenticadora o llave física (no SMS). | Captura del panel de seguridad Google. |
| MIT-02 | El backend accede al Sheet con **Service Account** dedicado, con permiso de edición únicamente sobre el Sheet objetivo, nunca con las credenciales del dueño. | Revisar permisos del Sheet: debe aparecer la SA con rol Editor; el dueño como Propietario; nadie más. |
| MIT-03 | El dueño conserva permisos de lectura/edición; **nadie más** tiene acceso (ni familiares, ni empleados sin rol). | Revisión trimestral de "Compartir" del Sheet. |
| MIT-04 | Backup semanal exportado a una carpeta cifrada en Drive del propio dueño, nombrada `backup-quotes-YYYYMMDD.xlsx` (devops OPS-06). | Lista de archivos en la carpeta. |
| MIT-05 | Revisión trimestral del "Activity Dashboard" del Sheet para detectar accesos anómalos. | Captura trimestral guardada en `governance/compliance/`. |
| MIT-06 | Si la empresa adquiere Google Workspace empresarial, migrar el Sheet a esa cuenta (recomendado). | Decisión del dueño. |

Prioridad: **Alta.** Sin estas mitigaciones, el deber de "seguridad razonable" del Art. 4(g) de la Ley 1581 queda en entredicho.

---

## 7. Decisión documentada: NIT fuera del sitio público

**Decisión:** el NIT **no aparece** en el footer, ni en metadatos del sitio, ni en `robots.txt`, ni en JSON-LD.

**Razones:**
1. **Fingerprinting fiscal / spam.** El NIT se extrae automatizadamente por scrapers y queda indexado como vector para campañas de phishing dirigido ("facturas falsas DIAN", suplantación de proveedores).
2. **No es dato público obligatorio en sitios web.** La DIAN exige el NIT en facturas y comunicaciones comerciales formales, no en marketing digital. El consumidor queda igualmente informado del Responsable del Tratamiento mediante la razón social, dirección y canal de contacto en la política.
3. **El NIT sí aparece** en:
   - `governance/legal/politica-tratamiento-datos.md` (documento legal publicable).
   - Facturación directa al cliente (fuera del sitio).
   - RNBD (si aplica).

**Nota al frontend (FE-14):** retirar NIT del footer confirmado.

---

## 8. Metodología y entrega

Ver `governance/metodologia.md` para:
- Modelo de entrega por hitos (G0 ya aprobado, G1 contratos, G2 implementación, G3 UAT).
- SLA de atención a bugs (P1–P4).
- Versionado semántico y política de deprecación de la política de tratamiento.
- Canales de reporte y responsables.

---

## 9. Preguntas abiertas para el usuario

| # | Pregunta | Impacto si no se resuelve | Estado R2 |
|---|---|---|---|
| Q1 | Razón social exacta y forma societaria (persona natural comerciante / SAS / Ltda. / S.A.) | No se puede publicar la política. Determina además la obligación RNBD (CMP-08). | **Pendiente — próxima sesión** |
| Q2 | NIT | Documento legal queda incompleto. | Pendiente |
| Q3 | Rango de activos totales del año fiscal anterior (en pesos y en UVT aprox.) | No se puede decidir obligación RNBD. Umbral: 100.000 UVT. | **Pendiente — próxima sesión** |
| Q4 | Representante legal (nombre, cédula) | Firma de la política y responsable ARCO quedan vacíos. | Pendiente |
| Q5 | Dirección física de notificaciones | Canal físico ARCO sin domicilio. | Pendiente |
| Q6 | Responsable interno de datos (persona natural que atiende el canal ARCO dentro de la Empresa) | No hay destinatario humano de las solicitudes ARCO; CMP-08 (RNBD) requiere identificar al responsable del tratamiento interno. | **Pendiente — próxima sesión** |
| Q7 | Correo ARCO definitivo. Sugerido: **`datos@<dominio>`** (confirmado por governance en R2). | No hay canal público. MIT-ARCO bloqueado. | Pendiente creación de cuenta |
| Q8 | ¿La cuenta Google del Sheet es personal o Workspace empresarial? | Define si MIT-06 es acción inmediata o aspiracional. | Pendiente |
| Q9 | Proveedor de correo elegido en producción (SMTP de Hostinger / Resend / otro) | Define quién figura como Encargado adicional en la política. | R2 fijó `resend` como default técnico; falta confirmación comercial. |

### 9.bis. Estado tras auditoría R2 (2026-10-02)

Hallazgos cuya responsabilidad total o parcial recae en governance:

| Hallazgo | Descripción | Estado R2 |
|---|---|---|
| **AU-C-01** (apoyo) | user_agent → hash SHA-256 reflejado en política, aviso, PLAN y mapa de PII. | **Resuelto.** |
| **AU-M-02** | Documentar regla `MAX(timestamp, ultimo_contacto)` y proceso trimestral de anonimización. | **Resuelto** en `retencion-y-borrado.md` v1.1. |
| **AU-H-06** | Guardar la versión del consentimiento del mapa en `localStorage` para invalidación automática al cambiar la política. | **Resuelto** en `texto-consentimiento.md` §B. Frontend ejecuta la implementación. |
| **AU-H-05** (asignación) | Confirmar `ARCO_EMAIL` y bloquear MIT hasta creación de cuenta. | **Resuelto como asignación.** Governance confirma el valor sugerido `datos@<dominio>` y bloquea MIT-ARCO. El cumplimiento efectivo depende del usuario (Q7). |
| **CMP-08 / AU-M-07** | Decisión RNBD. | **Diferido a próxima sesión.** Requiere Q1, Q3 y Q6. |

---

## 10. Deltas detectados contra `docs/ARCHITECTURE.md` v2.0 y contratos

> Governance no modifica contratos. Lista los deltas para que ARCHITECT y AUDIT los resuelvan.

1. **`user_agent` vs `user_agent_hash`.** El encargo del usuario describe `user_agent_hash` como PII hasheada. El contrato `data-model.md` (columna L) lo almacena **en claro truncado a 200 chars**. Governance documenta el estado real del contrato (claro truncado) en la política. **Recomendación a ARCHITECT:** o bien actualizar el encargo (dejar en claro truncado, que es minimización suficiente), o bien pedir a database/backend que lo hashee. Pendiente decisión.
2. **Checkbox: literal.** El contrato de consentimiento en ARCHITECTURE.md §Contrato de consentimiento ya trae un texto propuesto. Governance publica el **literal definitivo** en `governance/legal/texto-consentimiento.md`. Son equivalentes semánticamente; frontend debe usar el literal de governance (FE-10).
3. **Enlace del checkbox.** ARCHITECTURE habla de `/politica-privacidad.html`. Governance publica el fuente en `governance/legal/politica-tratamiento-datos.md`. Devops/frontend deben publicar el render HTML bajo esa ruta exacta.
4. **CMP-03 canal ARCO = `OWNER_EMAIL`.** La sección 11 de ARCHITECTURE sugiere usar `OWNER_EMAIL` como canal ARCO. Governance **separa** el canal ARCO (`datos@…`) del canal operacional (`dueno@…`): el primero recibe solicitudes de titulares; el segundo recibe notificaciones de cotizaciones. Razón: trazabilidad y evitar que peticiones ARCO queden sepultadas entre leads. Impacto: el `.env.example` debe añadir `ARCO_EMAIL` como variable informativa (no requerida por el backend, solo publicada en la política).
5. **Google Maps y cookies.** CMP-07 ya exige lazy consent. Governance añade en `aviso-cookies.md` el detalle de qué cookies setea Google Maps y confirma: sin interacción del usuario, no se setea nada.

---

## 11. Entregables producidos

- `governance/PLAN.md` (este archivo).
- `governance/legal/politica-tratamiento-datos.md`
- `governance/legal/aviso-privacidad.md`
- `governance/legal/aviso-cookies.md`
- `governance/legal/texto-consentimiento.md`
- `governance/legal/protocolo-arco.md`
- `governance/legal/retencion-y-borrado.md`
- `governance/metodologia.md`

---

## 12. Deltas detectados en R2 (2026-10-02)

Deltas e incoherencias nuevas detectadas durante la aplicación de los acuerdos R2. No se corrigen aquí; se listan para architect/audit en la próxima iteración.

1. **`protocolo-arco.md`** (versión 1.0) todavía usa el formato de canal ARCO sin la aclaración de "bloqueo hasta creación de cuenta" documentada en §3 de este PLAN. Si tras R2 el usuario crea la cuenta, el protocolo debe pasar a v1.1 reemplazando el placeholder.
2. **`aviso-cookies.md`** no se tocó en R2 porque su contenido sobre Google Maps es compatible con la regla de versionado del §B de `texto-consentimiento.md`. Si en el futuro se añade otra integración (p. ej. reCAPTCHA, analítica), deberá revisarse la coherencia de la clave `maps_consent` vs claves adicionales de consentimiento.
3. **Hoja real (database)**: el schema `database/schema/quotes.sheet.md` debe reflejar en v2 tanto el renombrado de L a `user_agent_hash` como la nueva columna M `ultimo_contacto`. Governance publica la política sobre el supuesto de que ese cambio queda cerrado por database en R2; si el agente database no lo entrega, hay delta documental vs realidad.
4. **CMP-08 (RNBD) sigue abierto** — se escaló al usuario con tres preguntas focalizadas (Q1, Q3, Q6). No es viable publicar un valor por defecto porque las sanciones por omisión del RNBD (hasta 2.000 SMLMV) exigen evaluación caso a caso.
5. **`CORS_ORIGIN` y dominio definitivo (D1)** — governance recuerda a devops/architect que, hasta que D1 esté resuelto, el campo "Sitio web" de la política lleva el valor `https://metalurgicadelcaribe.co` como marcador sujeto a confirmación.
