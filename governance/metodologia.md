# Metodología de entrega y mantenimiento

**Versión:** 1.0 — 2 de octubre de 2026
**Alcance:** sitio web + backend ligero de Metalúrgica del Caribe (v2 según `docs/ARCHITECTURE.md`).

---

## 1. Modelo de entrega

Equipo pequeño (una persona + agentes especializados), alcance acotado, cliente único. Se usa **Kanban ligero con WIP limitado y gates por hito**, no Scrum. Razón: no hay sprints con equipo multidisciplinario negociando prioridades; hay un flujo lineal con validaciones del dueño.

### Hitos (gates)

| Gate | Qué se entrega | Criterio de salida | Estado |
|---|---|---|---|
| **G0 — Marco** | ARCHITECTURE.md v2.0 + compliance mapeado | ARCHITECT publicó y governance validó la lista de obligaciones | Aprobado 2026-10-02 |
| **G1 — Contratos** | `docs/contracts/` (api, data-model, env) + `governance/legal/*` v1 | Todos los agentes leyeron y publicaron su `PLAN.md` | En curso |
| **G2 — Implementación** | Código de backend, frontend, database, devops | Suite de tests pasa, CI verde, documentación mínima publicada | Pendiente |
| **G3 — UAT y entrega** | Demo al dueño, migración de dominio, DNS, cuentas Google | Firma de aceptación del dueño sobre el `SOW` (ver sección 5) | Pendiente |
| **G4 — Operación** | Garantía 90 días + plan de mantenimiento continuo | Dueño opera, equipo responde SLA | Pendiente |

### Definición de Terminado (DoD) global

Un entregable está "terminado" cuando:
- Cumple su criterio de aceptación (RF/NFR en ARCHITECTURE).
- Tiene pruebas automáticas donde aplique (backend, frontend crítico).
- Cumple los requisitos de `docs/contracts/compliance.md` (en construcción).
- Está documentado en el README de su carpeta.
- Pasa revisión por el agente **audit**.
- Pasa revisión legal de governance cuando toca PII (formularios, políticas).

---

## 2. Prácticas de código

- **Ramas:** trunk-based. `main` siempre deployable. Ramas cortas de 1 día nombradas `feat/<id>`, `fix/<id>`, `docs/<id>`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`). Máximo 72 chars en la primera línea.
- **Pull requests:** máximo 400 líneas de diff. PRs más grandes se dividen.
- **Revisión:** audit revisa cambios que crucen límites entre agentes. Governance revisa cualquier cambio que toque PII, consentimiento o políticas.
- **CODEOWNERS:** se declara en `.github/CODEOWNERS` cuando devops publique el repo (ticket OPS pendiente).

---

## 3. Versionado

### 3.1. Software

**SemVer** (`MAJOR.MINOR.PATCH`):
- `MAJOR`: cambios incompatibles de API (p. ej., renombrar campos del formulario).
- `MINOR`: funcionalidad nueva compatible (p. ej., añadir un servicio al enum).
- `PATCH`: correcciones de bug sin impacto en contrato.

Visible en `CHANGELOG.md` (Keep a Changelog). Primera versión productiva: `2.0.0`.

### 3.2. Políticas legales

Versionado independiente por **fecha ISO** (`YYYY-MM-DD`). La versión vigente se refleja en el valor de `CONSENT_VERSION` y en el encabezado de cada documento `.md` en `governance/legal/`. Las versiones anteriores se conservan en `governance/legal/historico/` cuando se publique un cambio sustancial.

### 3.3. Política de deprecación

- Un cambio que afecte sustancialmente la **finalidad** o las **transferencias** obliga a:
  1. Nueva versión fechada.
  2. Comunicación a Titulares vigentes por el canal registrado.
  3. Renovación de autorización si cambia la finalidad.
- Un cambio cosmético (redacción, aclaración) solo requiere nueva versión, sin renovación.

---

## 4. SLA de mantenimiento

Clasificación de incidencias conforme a ISO/IEC 14764.

| Severidad | Descripción | Tiempo de respuesta | Tiempo de resolución objetivo |
|---|---|---|---|
| **P1 — Crítico** | Formulario no envía, sitio caído, pérdida de datos, filtración de PII | ≤ 2 horas hábiles | ≤ 24 horas |
| **P2 — Alto** | Correo no llega al dueño, mapa roto, SEO degradado | ≤ 1 día hábil | ≤ 5 días hábiles |
| **P3 — Medio** | Bug cosmético, texto incorrecto, mejora de accesibilidad reportada | ≤ 3 días hábiles | ≤ 15 días hábiles |
| **P4 — Bajo** | Idea nueva, cambio de contenido no urgente | ≤ 5 días hábiles | Según calendario trimestral |

**Horario de atención:** lunes a viernes 8:00 – 18:00 (hora de Colombia), excluyendo festivos nacionales. P1 se atiende 24/7 durante el período de garantía (ver sección 6).

**Canal de reporte:** correo [PENDIENTE_USUARIO: canal de soporte técnico — sugerido `soporte@metalurgicadelcaribe.co`] con asunto `[P1|P2|P3|P4] descripción corta`.

---

## 5. Alcance (SOW resumido)

> El SOW formal se firma al cierre de G3. Este resumen refleja el alcance acordado a 2026-10-02.

### Entregables

- Sitio web público en `metalurgicadelcaribe.co` según RF-01 a RF-12.
- Backend Fastify + endpoint `POST /api/quotes`.
- Hoja de Google Sheets configurada con permisos mínimos.
- Correo transaccional desde dominio propio.
- Documentación de usuario (dueño), de operación (devops) y legal (governance).
- Garantía 90 días (ver sección 6).

### Exclusiones explícitas

- No se incluye panel de administración, autenticación, CMS, catálogo con precios, pasarela de pago, CRM, chat en vivo ni WhatsApp Business API.
- No se incluye producción de fotografía profesional (se usan Unsplash y fotos del dueño).
- No se incluye traducción a otros idiomas.
- No se incluyen campañas de SEO/SEM pagadas.
- No se incluye registro ante la SIC (RNBD): es decisión y trámite del dueño con su contador.

### Supuestos

- El dueño provee los datos corporativos pendientes (Q1–Q8 en PLAN.md).
- El dueño cuenta con cuenta Google y accede al Sheet.
- El dueño designa un correo profesional.
- La revisión legal final queda a cargo del dueño o su abogado.

### Gestión de cambios

Todo pedido fuera de alcance entra como **Change Request (CR)**:
1. Dueño lo envía por correo con descripción y motivación.
2. Equipo responde con estimación de tiempo, costo e impacto en el cronograma.
3. Dueño aprueba o rechaza por escrito.
4. Solo tras aprobación se implementa.

### Comunicación

- **Demo por hito:** videollamada corta al cerrar G1, G2 y G3.
- **Reporte semanal:** correo con 4 bullets: hecho / siguiente / riesgos / decisiones pendientes del dueño.
- **Idioma:** español claro, sin jerga técnica salvo necesidad.

---

## 6. Garantía

- **Período:** 90 días calendario desde la aceptación formal de G3.
- **Cubre:** corrección sin costo de defectos que impidan cumplir los RF/NFR del ARCHITECTURE v2.
- **No cubre:** nuevas funcionalidades, cambios de alcance, incidencias por errores operativos del dueño (p. ej., borrar accidentalmente el Sheet), caída de servicios de terceros (Google, proveedor de correo, CDN) salvo mala configuración imputable al equipo.

Al término de la garantía, se ofrece un **plan de mantenimiento continuo** cuyo costo y alcance se negocian con el dueño.

---

## 7. Mantenimiento continuo (post-garantía)

Siguiendo ISO/IEC 14764, los tipos de mantenimiento se clasifican en:

| Tipo | Ejemplo | Frecuencia estimada |
|---|---|---|
| Correctivo | Formulario deja de enviar | Reactivo (SLA sección 4) |
| Adaptativo | Google Sheets API cambia versión | 1–2 veces al año |
| Perfectivo | Añadir servicio nuevo al enum | Según necesidad del dueño |
| Preventivo | Actualizar dependencias, rotar secretos | Mensual |

### Calendario mínimo

- **Semanal:** verificar backup del Sheet; revisar emails de alerta de salud.
- **Mensual:** actualizar dependencias de backend (`npm audit`), revisar logs.
- **Trimestral:** revisar accesos al Sheet (ver PLAN.md §6 MIT-05); revisar métricas de salud y cuotas.
- **Semestral:** prueba de restauración desde backup; revisión de SPF/DKIM/DMARC; revisión de certificado TLS.
- **Anual:** revisión integral de la Política de Tratamiento con abogado; renovación de `CONSENT_VERSION` si procede; revisión de dominio y DNS.

### Estimación anual de esfuerzo

| Concepto | Horas/año estimadas |
|---|---|
| Mantenimiento preventivo | 24 |
| Mantenimiento correctivo (reserva) | 20 |
| Mantenimiento adaptativo | 10 |
| Revisión legal anual (dueño con su abogado — no incluido) | — |
| **Total técnico (estimado)** | **~54 horas/año** |

Esta estimación debe ajustarse a la volumetría real tras los primeros 6 meses de operación.

---

## 8. Handover al final de G3

Entrega formal al dueño:

1. Credenciales y accesos transferidos de forma segura (gestor de contraseñas o canal cifrado, nunca por correo en claro).
2. Inventario de servicios contratados con costo mensual estimado (dominio, hosting backend, proveedor de correo).
3. Manual del dueño: cómo revisar el Sheet, cómo responder una solicitud ARCO, cómo pedir soporte.
4. Documentación de operación para devops (runbooks en `docs/`).
5. Firma de aceptación.

---

## 9. Referencias

- ARCHITECTURE: `docs/ARCHITECTURE.md` v2.0.
- Contratos: `docs/contracts/api.openapi.yaml`, `data-model.md`, `env.md`.
- Compliance: `docs/contracts/compliance.md` (en construcción con audit).
- Legal: `governance/legal/*`.
