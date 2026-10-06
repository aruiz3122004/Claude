# frontend — Metalúrgica del Caribe

Sitio estático en vanilla ES2020. Sin framework, sin dependencias en runtime.

## Cómo correr local

El sitio consume `POST /api/quotes` del backend; para la experiencia completa use `vercel dev` desde la raíz del repositorio, que sirve a la vez el `frontend/` como estático y las funciones serverless de `backend/api/*.ts`.

```powershell
# Desde la raíz del repo
npx vercel dev
# -> http://localhost:3000/
```

Para explorar solo el HTML/CSS sin backend:

```powershell
# Opción A — Python
python -m http.server 8080 --directory frontend

# Opción B — Node
npx serve frontend
```

## Estructura

```
frontend/
├── index.html                    # landing (todas las secciones)
├── politica-privacidad.html      # política Ley 1581 (publicada)
├── assets/
│   └── brand-mark.svg            # SVG fuente del logo
├── public/
│   ├── favicons/                 # íconos generados (ver script)
│   ├── robots.txt                # (dueño: devops)
│   ├── sitemap.xml               # (dueño: devops)
│   └── site.webmanifest          # (dueño: devops)
├── styles/
│   ├── tokens.css                # design tokens, modo dark/light
│   └── main.css                  # componentes y layout
├── scripts/
│   ├── config.js                 # placeholders inyectados en build
│   ├── theme.js                  # modo claro/oscuro
│   ├── main.js                   # nav móvil, filtro, formulario, mapa
│   └── generate-favicons.ps1     # genera PNG + ICO desde brand-mark
├── PLAN.md
└── README.md
```

## Decisiones clave

- **Sin framework.** Landing informativa, un formulario, cero rutas internas que justifiquen un bundle.
- **Mobile-first.** Breakpoints 360 / 414 / 768 / 1024 / 1280 / 1440.
- **Dark industrial por defecto + modo claro opcional.** Tokens semánticos en `tokens.css`, `data-theme` en `<html>`, persistido en `localStorage` (clave `mdc-theme`).
- **Accesible WCAG 2.2 AA.** Skip link, focus visible, labels asociados, `aria-live` en feedback, respeta `prefers-reduced-motion`, contraste AA en ambos temas.
- **Ley 1581 cumplida en cliente.** Checkbox de consentimiento no premarcado, botón de envío deshabilitado hasta marcarlo, versión del aviso enviada al backend como `consentimiento_version`.
- **Google Maps diferido.** No se carga iframe hasta que el visitante confirma; preferencia guardada en `localStorage.mapsConsent`.

## Fotografía — créditos

Fotografías de **Unsplash** — licencia libre con atribución recomendada. URLs usan el parámetro `?auto=format` para que Unsplash entregue AVIF/WebP según navegador, con `srcset` para 1x/2x. Si en producción se migra a imágenes propias del taller, mantener los mismos atributos `width`/`height` para no cambiar el CLS.

Lista de IDs usados (en orden del DOM):

- Servicios: `1504328345606`, `1572981779307`, `1565734102083`, `1534237710431`, `1581094488379`, `1518709268805`.
- Proyectos: `1600585154526`, `1486325212027`, `1565793298595`, `1558036117-15d82a90b9b1`, `1515263487990`, `1587293852726`.
- Proceso: `1581094288338`, `1503387762`, `1504917595217`, `1541888946425`.

## Variables de entorno expuestas al cliente

Expuestas en `scripts/config.js`:

| Clave | Propósito | Secreta | Reemplazo en build |
|-------|-----------|---------|--------------------|
| `MAPS_API_KEY` | Google Maps Embed API, restringida por dominio en Google Cloud. | No (pública, con whitelist). | Reemplazar `MAPS_API_KEY_PLACEHOLDER` por el valor real. |
| `API_BASE_URL` | Origen del backend. Vacío si se usa mismo origen (vercel). | No. | Dejar `''` para despliegues con rewrites en `vercel.json`. |
| `CONSENT_VERSION` | Versión del aviso de privacidad aceptado. | No. | Debe coincidir con `governance/legal/texto-consentimiento.md`. |

En Vercel el reemplazo se hace via step de build (sed) o cargando los valores en el adaptador de entorno al tiempo de deploy. Si `MAPS_API_KEY` queda como placeholder, el botón "Mostrar mapa" degrada a un enlace a `maps.google.com`.

## Favicons

Los íconos se generan ejecutando:

```powershell
pwsh ./frontend/scripts/generate-favicons.ps1
```

Produce en `frontend/public/favicons/`: `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. El fuente SVG es `assets/brand-mark.svg`; el script redibuja la geometría con GDI+ para no depender de un rasterizador externo.

## OG — regenerar `og-cover.jpg`

La imagen Open Graph se genera con GDI+ en PowerShell, sin dependencias
externas (misma técnica que `generate-favicons.ps1`). La fuente editable
está en `public/og-cover.svg`; la salida consumida por `index.html` es
`public/og-cover.jpg` (1200×630, JPEG calidad 85).

```powershell
# Regenerar el JPG desde la raíz del repo
pwsh ./frontend/scripts/generate-og-cover.ps1
```

Cuándo regenerarlo:

- Cambia la marca (brand-mark, color primario, tipografía display).
- Cambia la tagline del hero.
- Cambia la línea `DESDE 1999` o la plaza (`BARRANQUILLA`).

Si prefieres exportar el SVG a JPG con herramientas externas (p. ej. para
usar la fuente Oswald real en lugar del fallback Impact):

```bash
# Opcion A — rsvg-convert + ImageMagick
rsvg-convert -w 1200 -h 630 -f png frontend/public/og-cover.svg | \
  magick png:- -quality 85 frontend/public/og-cover.jpg

# Opcion B — svgexport (node)
npx svgexport frontend/public/og-cover.svg frontend/public/og-cover.jpg 1200:630
```

En producción, `index.html` referencia la ruta relativa `/og-cover.jpg`,
por lo que el `og:image` queda sirviéndose del mismo dominio y respeta
canonical sin acoplarse a `metalurgicadelcaribe.co`.

## Preparación E2E

Los selectores estables para Playwright están declarados como
`data-testid` en `index.html`. Primera opción: selectores por rol
accesible (`getByRole`, `getByLabel`). Fallback explícito:

| `data-testid` | Elemento | Rol |
|---------------|----------|-----|
| `field-nombre` | `#f-nombre` | textbox |
| `field-telefono` | `#f-telefono` | textbox |
| `field-email` | `#f-email` | textbox |
| `field-servicio` | `#f-servicio` | combobox |
| `field-mensaje` | `#f-mensaje` | textbox |
| `consent-checkbox` | `#f-consent` | checkbox |
| `submit-quote` | `#submitBtn` | button |
| `form-feedback` | `#formFeedback` | status (`aria-live="polite"`) |
| `maps-show` | `#mapShowBtn` | button |
| `maps-consent-modal` | `#consentModal` | dialog |

Arranque local para los tests:

```powershell
# Desde la raiz del repo
npx vercel dev    # http://localhost:3000
# en otra terminal
npx playwright test
```

Los mocks de Sheets / Resend / Upstash los provee el backend bajo
`TEST_MODE=1` (ver `backend/README.md`). El frontend no requiere ningun
mock propio: todas sus respuestas dependen de los status del endpoint
`/api/quotes` (202 / 400 / 429 / 5xx / network).

## Placeholders pendientes (requieren confirmación del usuario)

- Coordenadas geo exactas de Vía 40 #73-125. Aproximación usada en JSON-LD: `10.9878, -74.7889`.
- `MAPS_API_KEY_PLACEHOLDER` → clave real restringida por dominio.
- Dominio final (hoy `metalurgicadelcaribe.co` asumido) — ajustar canonical/OG/sitemap.
- Correo ARCO (`datos@metalurgicadelcaribe.co` sugerido) en política de privacidad.
- Confirmación de datos legales en la política (razón social, NIT, representante, teléfono, correo ARCO).

## Testing futuro

- Playwright E2E del flujo crítico de cotización en Chromium / Firefox / WebKit.
- axe-core en `index.html` + `politica-privacidad.html`.
- Lighthouse Performance ≥ 90, Accessibility ≥ 95.
