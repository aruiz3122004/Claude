# devops/maps — Provisionar MAPS_API_KEY

Objetivo: una API key de Google Maps restringida, con cuota baja, para el iframe de Google Maps en la seccion Contacto. Costo esperado: USD 0 (dentro de cuota gratuita de Google Maps Platform).

## 1. Crear el proyecto en Google Cloud

1. Ir a https://console.cloud.google.com/.
2. Crear proyecto nuevo: `metalurgica-del-caribe` (o usar uno existente si el dueno ya tiene).
3. Importante: usar la **misma cuenta Gmail** que posee el Google Sheet (mantener coherencia de acceso).
4. Habilitar facturacion con un metodo de pago. Google requiere tarjeta aunque el uso sea gratuito; sin tarjeta la API devuelve `OVER_QUERY_LIMIT` incluso en cuota free. Se mitiga con cuota maxima (paso 5).

## 2. Habilitar APIs necesarias

En **APIs & Services -> Library**, habilitar SOLO estas:

- **Maps Embed API** (necesaria, es la que usa `<iframe src="https://www.google.com/maps/embed/v1/place?...">`).
- (Opcional) Maps JavaScript API — solo si el frontend decide pasar a mapa interactivo. Para el MVP, el iframe Embed basta y es gratis sin limites.

Dejar deshabilitadas: Directions, Distance Matrix, Geocoding, Places. Reducen superficie y costo.

## 3. Crear la API key

1. **APIs & Services -> Credentials -> Create credentials -> API key**.
2. Nombrar la key: `metalurgica-caribe-maps-prod`.
3. Copiar el valor; sera el contenido de `MAPS_API_KEY`.

## 4. Restringir la key (obligatorio)

En la pagina de la key:

### Application restrictions
- Seleccionar **HTTP referrers (web sites)**.
- Agregar los siguientes referrers:
  - `https://[PENDIENTE_USUARIO: dominio]/*`
  - `https://www.[PENDIENTE_USUARIO: dominio]/*`
  - `https://*.vercel.app/*` (para previews de Vercel; refinar a `[PENDIENTE_USUARIO: dominio-preview]/*` si se conoce el patron exacto)
  - `http://localhost:3000/*` (desarrollo local)
  - `http://localhost:*/*` (desarrollo local, puerto variable)

### API restrictions
- Seleccionar **Restrict key**.
- Marcar solo **Maps Embed API** (y Maps JavaScript API si se habilito).

Guardar. La restriccion tarda ~5 min en propagar.

## 5. Cuota maxima diaria (evitar bill shock)

**APIs & Services -> Enabled APIs -> Maps Embed API -> Quotas**:

- Maps Embed API: la version Embed basica es **gratis sin limite**. Dejar cuota por defecto.
- Si se habilito **Maps JavaScript API** (NO recomendado para MVP), aplicar:
  - **Map loads per day: 1000** (muy por debajo del free tier de 28 k/mes, protege ante abuso).
  - **Map loads per minute per user: 10**.

Guardar. Si alguna cuota se supera, la API devuelve error y el frontend degrada a enlace estatico (comportamiento ya definido en ARCHITECTURE.md §10).

## 6. Alertas de facturacion

**Billing -> Budgets & alerts -> Create budget**:
- Nombre: `maps-caribe-budget`.
- Monto: **USD 1/mes**.
- Alertas al 50%, 90%, 100% al correo del dueno (`OWNER_EMAIL`).

Esto garantiza aviso temprano si alguien abusa de la key o si la restriccion por referrer falla.

## 7. Entregar la key

- Guardar el valor en **Vercel UI -> Settings -> Environment Variables**:
  - Nombre: `MAPS_API_KEY`.
  - Entornos: Production, Preview.
  - Marcar como **plain text** (es publica, se compila al bundle del frontend).
- NO commitear el valor al repo.

## 8. Rotacion y revocacion

- Rotar la key cada **12 meses**, o inmediatamente si:
  - Aparece en los logs de un repo publico.
  - El dashboard de Google muestra uso anomalo desde referrers desconocidos.
- Para rotar: crear nueva key -> actualizar en Vercel -> redeploy -> eliminar la antigua.
- Para revocar en incidente: **APIs & Services -> Credentials -> Delete key**. El frontend caera a fallback (enlace estatico a Google Maps).

## 9. Validacion

Tras el primer deploy con la key:
```
curl -sI "https://www.google.com/maps/embed/v1/place?key=<MAPS_API_KEY>&q=Barranquilla" \
  -H "Referer: https://[PENDIENTE_USUARIO: dominio]/"
```
Debe devolver `200 OK`. Si devuelve `403` revisar restricciones de referrer.
