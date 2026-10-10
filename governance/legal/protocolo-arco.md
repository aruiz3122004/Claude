# Protocolo de atención de solicitudes del Titular (Habeas Data)

> **BORRADOR PARA REVISIÓN LEGAL.**

**Versión:** 1.0 — 2 de octubre de 2026

Este documento es **interno**. Describe cómo se atiende una solicitud de un Titular que ejerce sus derechos conforme a la Ley 1581 de 2012. No se publica en el sitio; la versión pública es la Sección 9 de la Política de Tratamiento.

---

## 1. Canal

- **Correo único:** [PENDIENTE_USUARIO: ARCO_EMAIL — sugerido `datos@metalurgicadelcaribe.co`].
- Asuntos aceptados en el buzón: cualquier mensaje con "Habeas Data", "datos personales", "mis datos", "eliminar", "actualizar" o "cotización" (fallback) en asunto o cuerpo.
- Responsable: el dueño (o persona designada).

> **Importante:** este canal es distinto del `OWNER_EMAIL` que recibe las notificaciones de cotización. Separarlos evita que las solicitudes legales queden enterradas entre leads.

---

## 2. Tipos de solicitud y plazos legales

| Tipo | Qué pide el Titular | Plazo (Ley 1581) | Prórroga | Máximo |
|---|---|---|---|---|
| **Consulta** (Art. 14) | "¿Qué datos míos tienen?" "Enviadme copia." | 10 días hábiles | 5 días hábiles | 15 días hábiles |
| **Reclamo** (Art. 15) | Corrección, actualización, supresión, revocación de autorización, oposición | 15 días hábiles | 8 días hábiles | 23 días hábiles |

Los días son hábiles conforme al calendario colombiano. Si se requiere prórroga, se debe **informar al Titular** antes del vencimiento del plazo original indicando los motivos y la fecha estimada de respuesta.

---

## 3. Flujo operativo

### Paso 1. Recepción (día 0)

1. Acusar recibo por el mismo canal dentro de las 48 horas siguientes.
2. Verificar que la solicitud incluya: identidad del Titular, copia de documento, descripción clara.
3. Si falta algo, requerir al Titular en los **5 días hábiles** siguientes (Art. 15 Ley 1581). El plazo se suspende hasta que el Titular complete.

### Paso 2. Verificación de identidad

- Comprobar que el documento adjunto corresponda a los datos en el Sheet.
- Si el solicitante es representante: pedir poder o autorización escrita más documento del representante.
- Si no se puede verificar razonablemente la identidad, responder negando el acceso con fundamento y orientar al Titular.

### Paso 3. Búsqueda en el Sheet

- Buscar en la columna E (`email`) y D (`telefono`) del Sheet.
- Si hay múltiples filas (varios envíos), tratarlas todas en la misma respuesta.
- Documentar en la bitácora qué filas se encontraron.

### Paso 4. Acción según el tipo

| Tipo | Acción |
|---|---|
| Consulta | Preparar export de las filas del Titular (sin columnas internas de hash). Enviar por el canal. |
| Rectificación | Editar las celdas correspondientes. Confirmar al Titular los campos actualizados. |
| Supresión / revocación | Marcar las filas para borrado (ver `retencion-y-borrado.md`). Confirmar al Titular. Si existe deber legal de conservación (p. ej., contrato comercial en curso), explicar y acordar fecha de borrado posterior. |
| Oposición | Detener todo contacto comercial inmediatamente. Si procede, borrar; si hay deber legal, conservar sin tratar. |

### Paso 5. Respuesta formal

- Usar la **plantilla** del Anexo A.
- Enviar por el mismo canal del Titular.
- Guardar copia en la bitácora.

### Paso 6. Registro

Toda solicitud (sea cual sea su desenlace) queda registrada en `governance/compliance/bitacora-arco.csv` con las columnas:

```
fecha_recepcion, tipo, titular_identificado(sí/no), accion_tomada, fecha_respuesta, dias_habiles_tomados, observaciones
```

Esta bitácora es prueba ante la SIC de cumplimiento.

---

## 4. Casos especiales

- **Solicitud ambigua.** Pedir aclaración por el canal; el plazo se suspende hasta respuesta.
- **Solicitud reiterada.** El Titular tiene derecho a consulta gratuita al menos una vez al mes (Art. 21 Dec. 1377). Más allá, se puede repercutir el costo real, previa comunicación.
- **Datos de un tercero.** Si un Titular pide datos de otra persona, se niega salvo representación acreditada.
- **Solicitud masiva o abusiva.** Documentar y responder dentro de plazo; no es causal de negación.

---

## 5. Anexo A — Plantilla de respuesta

```
Asunto: Respuesta a su solicitud sobre datos personales — [fecha]

Señor(a) [Nombre del Titular],

En respuesta a su solicitud recibida el [fecha de recepción], relativa a
[tipo: consulta / rectificación / supresión / revocación / oposición] de
sus datos personales, [razón social] le informa lo siguiente:

[Cuerpo según el tipo:
 - Consulta: "Adjuntamos los datos personales suyos que se encuentran en nuestros registros."
 - Rectificación: "Hemos actualizado los siguientes campos: [...]"
 - Supresión: "Hemos eliminado sus datos de nuestra base. La operación se completó el [fecha]."
 - Revocación: "Hemos registrado su revocación de autorización. No volveremos a tratar sus datos para la finalidad indicada."
 - Oposición: "Hemos cesado el tratamiento comercial de sus datos."]

Si usted considera que su solicitud no ha sido atendida satisfactoriamente,
puede acudir ante la Superintendencia de Industria y Comercio (SIC), Delegatura
para la Protección de Datos Personales (www.sic.gov.co).

Atentamente,

[Nombre]
[Cargo]
[Razón social] — NIT [NIT]
Correo: [PENDIENTE_USUARIO: ARCO_EMAIL]
```

---

## 6. Escalamiento interno

Si la solicitud excede la capacidad del dueño (por complejidad técnica, dudas legales o riesgo de queja ante la SIC), escalar a:
- Abogado de confianza: [PENDIENTE_USUARIO: datos del abogado si existe].
- Si no hay, consultar inmediatamente al asesor legal antes de responder.
