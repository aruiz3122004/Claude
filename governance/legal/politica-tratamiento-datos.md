# Política de Tratamiento de Datos Personales

> **BORRADOR PARA REVISIÓN LEGAL.** Este documento ha sido preparado por el responsable de cumplimiento del proyecto. **Debe ser revisado por un abogado habilitado en Colombia antes de su publicación oficial.** No constituye asesoría legal.

**Versión:** 1.1
**Fecha de entrada en vigencia:** 2 de octubre de 2026
**Normativa aplicable:** Ley 1581 de 2012, Decreto 1377 de 2013 y demás normas concordantes de la República de Colombia.

---

## 1. Identificación del Responsable del Tratamiento

| Campo | Dato |
|---|---|
| Razón social | [PENDIENTE_USUARIO: razón social] |
| NIT | [PENDIENTE_USUARIO: NIT] |
| Representante legal | [PENDIENTE_USUARIO: nombre y cédula del representante legal] |
| Domicilio | [PENDIENTE_USUARIO: dirección física], Barranquilla, Atlántico, Colombia |
| Correo para asuntos de datos personales (canal ARCO) | [PENDIENTE_USUARIO: ARCO_EMAIL — se sugiere `datos@metalurgicadelcaribe.co`] |
| Sitio web | https://metalurgicadelcaribe.co |
| Teléfono | [PENDIENTE_USUARIO: teléfono principal] |

En adelante, "la Empresa".

---

## 2. Marco normativo

Esta Política se adopta en cumplimiento de:

- **Ley 1581 de 2012**, por la cual se dictan disposiciones generales para la protección de datos personales.
- **Decreto 1377 de 2013**, reglamentario parcial de la Ley 1581.
- **Decreto Único Reglamentario 1074 de 2015**, en lo pertinente.
- **Circulares de la Superintendencia de Industria y Comercio** vigentes.

---

## 3. Definiciones

- **Titular:** persona natural cuyos datos personales son objeto de tratamiento.
- **Dato personal:** cualquier información vinculada o asociable a una persona natural identificada o identificable.
- **Dato sensible:** aquellos que afectan la intimidad del Titular o cuyo uso indebido puede generar discriminación (salud, orientación sexual, origen racial, etc.). **La Empresa no recolecta datos sensibles.**
- **Tratamiento:** cualquier operación sobre datos personales (recolección, uso, almacenamiento, supresión, etc.).
- **Autorización:** consentimiento previo, expreso e informado del Titular.
- **Encargado del Tratamiento:** quien, por cuenta de la Empresa, realiza operaciones sobre los datos (p. ej., proveedores tecnológicos).

---

## 4. Principios

El tratamiento se sujeta a los principios de **legalidad, finalidad, libertad, veracidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad**, conforme al Artículo 4 de la Ley 1581.

---

## 5. Datos personales recolectados

La Empresa recolecta, a través del formulario de cotización del sitio web, los siguientes datos:

| Dato | Carácter | Observación |
|---|---|---|
| Nombre | Obligatorio | Para dirigirse al Titular. |
| Teléfono | Obligatorio | Para contacto de cotización. |
| Correo electrónico | Obligatorio | Para contacto de cotización. |
| Servicio de interés | Obligatorio | Clasificación de la solicitud (residencial, comercial, industrial, portones, barandas, mobiliario, otro). |
| Mensaje | Obligatorio | Descripción libre de la necesidad. Puede contener la dirección del inmueble si el Titular decide incluirla. |
| Marca de tiempo | Técnico | Fecha y hora de envío. |
| Hash de dirección IP | Técnico | Valor no reversible usado para prevención de abuso (rate-limit). No se almacena la IP en claro. |
| User-agent del navegador | Técnico | Se almacena únicamente el **hash SHA-256 del user agent (minimización Ley 1581 art. 4 lit. e)**. No se conserva el user agent en claro. |
| Marca de consentimiento y versión | Prueba legal | Registra la autorización otorgada. |
| Fecha de último contacto (`ultimo_contacto`) | Técnico / operativo | Fecha del último intercambio comercial posterior al envío del formulario. Permite medir la retención real de 24 meses desde el último contacto, no desde el primer envío. |

**La Empresa no recolecta:** documento de identidad, fecha de nacimiento, dirección exacta a partir de geolocalización, datos sensibles, ni datos de menores de edad.

---

## 6. Finalidad del tratamiento

Los datos se tratan con una **única finalidad**:

> Responder a la solicitud de cotización presentada por el Titular y hacer el seguimiento comercial de dicha solicitud hasta su cierre (contratación o descarte).

Lo anterior incluye:
- Contactar al Titular por teléfono, correo electrónico o WhatsApp.
- Enviar presupuestos, especificaciones técnicas y confirmaciones.
- Dar seguimiento al proceso de venta y, de concretarse, a la ejecución del trabajo.

**No se usan los datos para:**
- Marketing masivo o envío de boletines.
- Perfilamiento comercial automatizado.
- Transferencia a terceros con fines publicitarios.
- Decisiones automatizadas con efectos jurídicos.

---

## 7. Base legal del tratamiento

**Autorización previa, expresa e informada del Titular**, otorgada mediante marcación afirmativa de la casilla de consentimiento del formulario, conforme a los Artículos 9 de la Ley 1581 y 7 del Decreto 1377.

La Empresa conserva prueba electrónica de dicha autorización (marca, fecha, versión del aviso aceptado) por el mismo término que los datos.

---

## 8. Derechos del Titular

Conforme al Artículo 8 de la Ley 1581, el Titular tiene derecho a:

- a) **Conocer, actualizar y rectificar** sus datos personales.
- b) **Solicitar prueba** de la autorización otorgada.
- c) **Ser informado** del uso dado a sus datos.
- d) **Presentar quejas** ante la Superintendencia de Industria y Comercio (SIC) por infracciones.
- e) **Revocar la autorización** y/o **solicitar la supresión** del dato cuando no exista un deber legal de conservarlo.
- f) **Acceder gratuitamente** a sus datos personales que hayan sido objeto de tratamiento.

Estos derechos pueden ejercerse personalmente o a través de representante debidamente acreditado.

---

## 9. Procedimiento para ejercer los derechos

### Canal de atención

Las solicitudes se reciben en el correo **[PENDIENTE_USUARIO: ARCO_EMAIL — sugerido `datos@metalurgicadelcaribe.co`]**, con el asunto "Solicitud Habeas Data — [tipo]".

### Contenido mínimo de la solicitud

1. Nombres y apellidos completos.
2. Fotocopia o imagen legible del documento de identidad.
3. Correo electrónico y teléfono de contacto.
4. Descripción clara de la solicitud (consulta, actualización, supresión, revocación, oposición).
5. En caso de representación, documento que la acredite.

### Plazos de respuesta (Ley 1581)

| Tipo | Plazo | Prórroga máxima |
|---|---|---|
| Consulta (Art. 14) | 10 días hábiles | 5 días hábiles adicionales |
| Reclamo (Art. 15) | 15 días hábiles | 8 días hábiles adicionales |

Si vencido el plazo no se obtiene respuesta satisfactoria, el Titular puede acudir a la Superintendencia de Industria y Comercio (SIC), Delegatura para la Protección de Datos Personales.

El procedimiento interno está detallado en `governance/legal/protocolo-arco.md`.

---

## 10. Vigencia y período de retención

- La presente Política entra en vigencia el **2 de octubre de 2026**.
- Los datos personales se conservarán por un período máximo de **24 meses contados desde el último contacto con el Titular**, medido como `MAX(timestamp, ultimo_contacto)`. Vencido ese plazo, los datos de identificación directa (nombre, teléfono, correo, mensaje, hash de IP y hash del user-agent) se **anonimizarán o suprimirán** manteniendo únicamente columnas agregadas no identificativas para análisis estadístico.
- El procedimiento operativo está en `governance/legal/retencion-y-borrado.md`.

---

## 11. Transferencias y transmisiones a terceros

La Empresa utiliza los siguientes **Encargados del Tratamiento** (terceros que procesan datos por cuenta de la Empresa). Todos aplican sus propias cláusulas de confidencialidad y seguridad en sus Términos de Servicio:

| Encargado | Rol | Datos tratados | Ubicación de procesamiento |
|---|---|---|---|
| **Google LLC** (Google Sheets API, Google Drive) | Almacenamiento de la hoja de cotizaciones y backups. | Todos los campos del formulario. | Centros de datos de Google (Estados Unidos y/o Unión Europea, según asignación de la cuenta). |
| **[PENDIENTE_USUARIO: proveedor de correo — p. ej. Hostinger SMTP / Resend]** | Envío del correo de notificación de cotización al dueño. | Nombre, correo, teléfono, servicio, mensaje. | Infraestructura del proveedor. |
| **Google LLC** (Google Maps embebido) | Visualización de la ubicación de la Empresa. | Dirección IP del visitante (solo si el visitante activa el mapa). | Infraestructura de Google. |

**No existen transferencias de datos a terceros con fines comerciales propios de estos.** La relación es exclusivamente de Encargado del Tratamiento (prestación técnica de servicios).

**Transferencia internacional:** parte del procesamiento ocurre fuera de Colombia. Esto se encuentra permitido por el Artículo 26 de la Ley 1581, bajo las garantías contractuales ofrecidas por los proveedores en sus términos de servicio, y por operar éstos en jurisdicciones con niveles adecuados de protección reconocidos.

---

## 12. Seguridad de la información

La Empresa aplica medidas administrativas, técnicas y humanas razonables, entre ellas:

- Transmisión cifrada (HTTPS/TLS) de todos los formularios.
- Acceso al almacén de datos (hoja de cálculo) restringido a la cuenta del dueño y a una cuenta de servicio dedicada (service account) con permisos mínimos.
- Verificación en dos pasos obligatoria sobre la cuenta del dueño.
- Enmascaramiento de datos personales en registros de operación (logs).
- Backup semanal de la base.
- Revisión trimestral de accesos.

---

## 13. Autorización previa, expresa e informada

El Titular otorga su autorización marcando la casilla "He leído y acepto la Política de Tratamiento de Datos Personales" en el formulario de cotización del sitio. La casilla **no viene premarcada**; el envío del formulario está bloqueado si no se marca.

El texto literal del consentimiento se encuentra en `governance/legal/texto-consentimiento.md` y se publica junto al formulario.

---

## 14. Vigencia y modificaciones

### Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-02 | Versión inicial. |
| 1.1 | 2026-10-02 | Alineación con el contrato técnico resultante de la auditoría R2 (2026-10-02): el user-agent pasa a almacenarse como hash SHA-256 (minimización, Ley 1581 art. 4 lit. e); se incorpora la columna `ultimo_contacto` para medir la retención real de 24 meses desde el último contacto. |

### Reglas de modificación

La Empresa podrá modificar esta Política. En caso de cambios sustanciales, lo informará:

1. Publicando la nueva versión en la URL `https://metalurgicadelcaribe.co/politica-privacidad.html`.
2. Actualizando el valor de `CONSENT_VERSION` del formulario.
3. Comunicando a los Titulares cuyos datos estén vigentes, por el canal de contacto registrado, cuando el cambio afecte sustancialmente la finalidad o las transferencias.

Las versiones anteriores se conservan como registro histórico para efectos de prueba.

---

## 15. Autoridad de control

El Titular puede presentar queja ante la **Superintendencia de Industria y Comercio – Delegatura para la Protección de Datos Personales**:
- Sitio: https://www.sic.gov.co
- Dirección: Carrera 13 No. 27-00, Bogotá D.C.
- Línea gratuita nacional: 01 8000 910165

---

**Firma del Responsable:**

[PENDIENTE_USUARIO: nombre del representante legal]
Representante legal
[PENDIENTE_USUARIO: razón social] — NIT [PENDIENTE_USUARIO: NIT]
Barranquilla, 2 de octubre de 2026
