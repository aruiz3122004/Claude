# Textos de consentimiento — literales para el frontend

> **BORRADOR PARA REVISIÓN LEGAL.**

**Versión del aviso:** `2026-10-02` (valor que debe ir en la variable `CONSENT_VERSION` y en la columna `consentimiento_version` de cada fila del Sheet).

Este archivo define los **textos literales** que debe mostrar el frontend. Cualquier cambio exige nueva versión y nueva fecha.

---

## 1. Checkbox del formulario de cotización (RF-09, FE-10)

### Reglas vinculantes

- La casilla **NO** debe venir premarcada (`checked="false"` por defecto).
- El envío del formulario debe estar **bloqueado en cliente y en servidor** si la casilla no está marcada.
- El enlace abre `/politica-privacidad.html` y debe llevar `rel="noopener noreferrer"`.
- Debe quedar visualmente claro que es un control interactivo (contraste del borde, no un adorno).
- Debe ser accesible por teclado y tener un `<label>` asociado.
- Target táctil mínimo 44 x 44 px (NFR accesibilidad).

### Texto literal del label

> He leído y acepto la [Política de Tratamiento de Datos Personales](/politica-privacidad.html) de Metalúrgica del Caribe. Autorizo que mis datos sean usados únicamente para responder y hacer seguimiento a esta cotización, conforme a la Ley 1581 de 2012.

### Mensaje de error si no está marcada

> Para enviar la cotización, debe aceptar la Política de Tratamiento de Datos.

### Texto auxiliar bajo el formulario (opcional, recomendado)

> Sus datos no se usan para publicidad ni se comparten con terceros. Puede pedir su eliminación en cualquier momento escribiendo a [PENDIENTE_USUARIO: ARCO_EMAIL].

---

## §B. Consentimiento para activar Google Maps (AU-H-06)

Esta sección complementa la §2 (banner inicial) y recoge la decisión de la auditoría R2 (2026-10-02) sobre la **invalidación automática del consentimiento** del mapa cuando cambie la política.

### Texto literal del modal del frontend al activar el mapa

> **Cargar Google Maps**
>
> Para mostrarle nuestra ubicación necesitamos cargar un recurso de Google LLC. Al pulsar "Mostrar mapa":
>
> - Google podrá recibir su dirección IP y la URL desde la que lo visita.
> - Es posible que se instalen cookies del dominio `google.com` en su navegador.
> - Esta decisión se guarda únicamente en su navegador (`localStorage`) y no se envía a nuestros servidores.
>
> Si prefiere no cargarlo, puede ver nuestra dirección en texto, llamarnos o abrir Google Maps en una pestaña nueva por su cuenta.
>
> [Mostrar mapa]   [Cancelar]   [Más información](/politica-cookies.html)

### Reglas vinculantes del consentimiento del mapa

1. **Clave y formato de almacenamiento.** Al pulsar "Mostrar mapa", el frontend ejecuta:

   ```js
   localStorage['maps_consent'] = '2026-10-02';
   ```

   El valor almacenado es **la versión del consentimiento vigente** (misma cadena que `CONFIG.CONSENT_VERSION` y que `consentimiento_version` del formulario), **no** un booleano ni la cadena `'accepted'`.

2. **Regla de invalidación automática.** Cada vez que el frontend carga, antes de insertar el iframe debe comparar:

   ```js
   localStorage['maps_consent'] === CONFIG.CONSENT_VERSION
   ```

   - Si **coinciden**: se considera consentimiento vigente y se puede insertar el iframe sin volver a preguntar.
   - Si **no coinciden** (valor ausente, obsoleto como `'accepted'` legado, o versión antigua): se descarta el valor y se vuelve a mostrar el modal. Esto garantiza que un cambio de versión de la política re-pida el consentimiento sin intervención manual del operador.

3. **Alcance del consentimiento.** Es por dispositivo/navegador. No se envía al backend ni se correlaciona con el formulario de cotización. Es una preferencia de visualización, no una autorización de tratamiento de datos personales por la Empresa.

4. **Revocación.** El Titular puede borrar la clave `maps_consent` del `localStorage` desde su navegador. En cuanto lo haga, el modal volverá a aparecer en la siguiente carga.

5. **Versionado.** El valor de la versión se sincroniza con §4 de este documento y con la fecha efectiva de la Política de Tratamiento. Toda publicación de nueva versión de la política invalida automáticamente los consentimientos de mapa anteriores por aplicación de la regla 2.

---

## 2. Banner de Google Maps (CMP-07, FE-11)

Antes de que el usuario interactúe, en lugar del iframe se muestra una tarjeta con el siguiente texto y dos acciones.

### Título

> Ubicación en Google Maps

### Cuerpo

> Para mostrar el mapa cargamos un recurso de Google, que puede instalar cookies de google.com en su navegador y recibir su dirección IP. Si no desea cargarlo, puede ver la dirección en texto o abrir Google Maps en una pestaña nueva.

### Botón primario

> Mostrar mapa

### Enlace secundario

> Abrir en Google Maps (nueva pestaña)

### Enlace terciario

> Más información sobre cookies

(Enlace a `/politica-cookies.html`.)

### Reglas vinculantes

- Hasta que el usuario pulse "Mostrar mapa", el `<iframe>` **no debe existir** en el DOM.
- Al pulsar, se inserta el iframe con el `src` de Google Maps y se setea `localStorage['maps_consent'] = '2026-10-02'` para no volver a preguntar en la misma sesión del navegador.
- La preferencia es por dispositivo/navegador. No se envía al backend.

---

## 3. Pie del formulario (línea de transparencia)

Texto corto bajo el botón de enviar, siempre visible:

> Tratamos sus datos conforme a la Ley 1581 de 2012. Finalidad única: responder a su cotización. Retención: 24 meses. Más detalle en nuestra [Política de Tratamiento de Datos](/politica-privacidad.html).

---

## 4. Correspondencia con el modelo de datos

Cuando el usuario marque y envíe:

| Campo del Sheet | Valor |
|---|---|
| `consentimiento` | `TRUE` |
| `consentimiento_version` | `2026-10-02` (valor literal, no la fecha de envío) |

Si governance publica una nueva versión de la política, debe:
1. Cambiar el valor de `CONSENT_VERSION` en el entorno.
2. Dejar registro de la versión anterior en `governance/legal/historico/` (crear al momento del cambio).
3. Las filas existentes conservan la versión bajo la cual el Titular dio su consentimiento.
