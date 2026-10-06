# frontend/PLAN.md — Metalúrgica del Caribe

arq_leída: 2.0 (2026-10-02)
contratos: `docs/contracts/api.openapi.yaml`, `docs/contracts/env.md`
estado: **BUILD en verde para FE-07..FE-16**

## 1. Dirección de diseño

### Personalidad
**Industrial · artesanal · confiable.** Nada frívolo, nada corporativo-genérico. El sitio debe oler a taller: óxido controlado, chispas, metal al rojo.

### Tipografía
- Titulares: **Oswald** (condensada, industrial). Fallback: Impact, "Arial Narrow".
- Texto: **Inter** (humanista, altura-x alta). Fallback: -apple-system, Segoe UI, Roboto.
- Escala: 12 / 14 / 16 / 18 / 24 / 32 / 48 / 72 px.

### Paleta — modo oscuro (default)
- `--bg: #0E1116`, `--surface: #171B22`, `--surface-2: #22272F`.
- `--text: #ECECEE` (15.6:1), `--text-muted: #9BA3AD` (6.9:1).
- `--primary: #E8521D` acero al rojo vivo.
- `--line: #2B313A`, `--line-strong: #3A414C`.
- `--success: #3BB273`, `--danger: #E5484D`.

### Paleta — modo claro
- `--bg: #F5F3EE` papel kraft industrial, `--surface: #FFFFFF`, `--surface-2: #ECE8E0`.
- `--text: #141821` (14.6:1 sobre bg), `--text-muted: #4B525C` (7.3:1).
- `--primary: #C2401A` (contraste 4.9:1 AA sobre bg claro); hover vira a `#E8521D`.
- `--line: #D7D2C7`, `--line-strong: #B6AF9F`.
- `--success: #1F8E58`, `--danger: #B2353A`.

Ambos temas se cargan en `tokens.css` con selectores `[data-theme="dark|light"]` sobre `:root`. `color-scheme: dark light` para que los controles nativos (scrollbars, formularios) sigan el modo.

### Alternancia de tema
- Toggle visible en el header (icono sol/luna). `aria-label` cambia según estado.
- Al cargar: `localStorage.mdc-theme` tiene prioridad; si no existe, `prefers-color-scheme`.
- Reactiva cambios del sistema solo si el usuario no ha elegido manualmente.
- `data-theme` se setea en `<html>`; `<meta name="theme-color">` se actualiza dinámicamente.
- Script `theme.js` cargado con `defer` (acepta un FOUC mínimo para respetar CSP sin inline).

### Espaciado, radios, movimiento
Base 8 px: 4/8/12/16/24/32/48/64/96. Radios: 0/4/8 (nunca pill). Movimiento 150–250 ms, `ease-out`, respeta `prefers-reduced-motion` vía override de tokens.

### Elementos distintivos (anti-genéricos, reforzados)
- **Patrón blueprint** sutil en el hero (grid 48×48 con máscara radial que lo degrada en los bordes).
- **Marcador de remache** (círculo con borde `--primary`) como viñeta de los items de contacto (pseudo `::before`).
- **Numeración 01/02/03/04** gigante en servicios, proyectos y proceso. En el hero, numeración decorativa "01/06" a 180 px con opacidad 0.045.
- **Barra de acento 2 px** color primary bajo cada `.section-title` (`::after`, 56 px de ancho).
- **Hero asimétrico 1.25fr / 1fr** en desktop ≥ 900 px, no 50/50.
- **Fotografía Unsplash** reemplazando los SVG genéricos de servicios/proyectos/proceso. El blueprint circular con remaches del hero se mantiene — es el elemento visual firma del sitio.
- **Ticker** bajo el hero con 5 términos del oficio (`SOLDADURA · CORTE · PLEGADO · GALVANIZADO · PINTURA ELECTROSTÁTICA`) en Oswald condensado.
- **Overlay** `linear-gradient(180deg, 0.15 → 0.55)` sobre cada foto para unificar paleta y asegurar legibilidad de los números/iconos sobre ellas.

## 2. Mapa de pantallas
Single page con secciones ancladas:
`#inicio` · `#servicios` · `#proyectos` · `#proceso` · `#nosotros` · `#contacto`
+ página legal `/politica-privacidad.html` (`doc-page`, consume mismos tokens).

## 3. Flujo crítico (candidato a E2E)
1. Visitante llega → hero.
2. Servicios → identifica el que necesita.
3. Proyectos → filtra por categoría (chips, `aria-pressed`).
4. Lee Proceso y Nosotros.
5. Contacto → completa formulario, **marca consentimiento**, envía a `POST /api/quotes` → ve confirmación con `id`.

## 4. Framework y librerías
- **Sin framework.** Decisión ratificada en ARCHITECTURE §8.
- **Sin dependencias en runtime.** JS vanilla ES2020.
- Scripts en archivos separados cargados con `defer`:
  - `config.js` (placeholders de entorno),
  - `theme.js` (modo claro/oscuro),
  - `main.js` (interacciones + envío).
- Google Maps JS **no cargado** hasta consentimiento explícito del visitante (`localStorage.mapsConsent`).
- Presupuesto: HTML+CSS+JS < 180 KB sin fuentes ni imágenes. Status actual: HTML ~24 KB, CSS ~18 KB, JS ~10 KB combinado. Holgado.

## 5. Backlog — estado

- **FE-01..FE-06** cerrados en v1.0.
- **FE-07** → **done.** `scripts/main.js` envía `POST ${API_BASE}/api/quotes` con JSON estricto. Replica cliente de `QuoteInputSchema`: `nombre` 2..120, `telefono` normalizado a `/^\+?\d{7,15}$/`, `email` RFC + max 254, `servicio` enum (`residencial|comercial|industrial|portones|barandas|mobiliario|otro`), `mensaje` 10..2000. Honeypot `website` oculto por CSS (`position: absolute; left: -9999px`), `tabindex="-1"`, `autocomplete="off"`. Estados: `idle → loading → success(id) | error(400|429|5xx|network)` con `aria-live="polite"`. En red caída, botón "Reintentar envío" sin perder lo escrito. 202 → muestra `id`, limpia formulario, mantiene foco en `#formFeedback`.
- **FE-08** → **done.** Checkbox NO premarcado con texto literal de `governance/legal/texto-consentimiento.md`. Link a `/politica-privacidad.html` con `rel="noopener noreferrer"`. Botón enviar `disabled`+`aria-disabled` mientras el checkbox esté sin marcar. En POST se envía `consentimiento: true` y `consentimiento_version: '2026-10-02'` tomada de `CONFIG.CONSENT_VERSION`.
- **FE-09** → **done.** Tokens para modo claro en `tokens.css`. Toggle sol/luna en el header. Script `theme.js`: resolución `localStorage > prefers-color-scheme > dark`. `prefers-reduced-motion` colapsa duraciones de transición. `<meta name="theme-color">` se actualiza al toggle. Contraste medido AA en ambos temas.
- **FE-10** → **done.** Fotografías Unsplash cargadas con `?w=X&q=80&auto=format&fit=crop` (Unsplash sirve AVIF/WebP). `srcset` 400/800 (/1200 en servicios), `sizes` responsivos, `width`/`height` declarados, `loading="lazy"`, `decoding="async"`. Overlay oscuro para fijar carácter. Numeración 01..06 superpuesta sobre las fotos de servicios; números 01..04 sobre las de proceso (como en PLAN §1).
- **FE-11** → **done.** Placeholder blueprint en `.map-wrap` con botón "Mostrar mapa". Al pulsar, `confirm()` nativo accesible preguntando por cookies; si acepta, inyecta iframe de Embed API con `src` construido con `encodeURIComponent` del query. `localStorage.mapsConsent = 'accepted'` persiste la elección. Fallback a enlace `maps.google.com` si no hay `MAPS_API_KEY` o si rechaza.
- **FE-12** → **done.** `<head>` completo: canonical, OG (`og:title`, `og:description`, `og:image`, `og:type=website`, `og:locale=es_CO`, `og:url`), Twitter Card `summary_large_image`, meta description ampliada con keywords locales naturales, meta keywords sutil, JSON-LD `LocalBusiness` con address, geo (10.9878, -74.7889 aprox.), telephone, openingHours, areaServed. `sitemap.xml` y `robots.txt` ya existen en `public/` (dueño: devops).
- **FE-13** → **done.** `assets/brand-mark.svg` es la fuente. `scripts/generate-favicons.ps1` genera: `favicon.ico` (16/32/48 multi), `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` 180×180 con fondo sólido, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (fondo sólido + padding 18 %). Enlaces añadidos al `<head>`. `favicon.svg` también se enlaza para navegadores que lo soportan.
- **FE-14** → **done.** `NIT 900.XXX.XXX-X` removido del footer. Reemplazado por "Vía 40 # 73-125, Barranquilla, Colombia" y enlace a política.
- **FE-15** → **done.** Ver §Dispositivos.
- **FE-16** → **done.** Hero `1.25fr / 1fr` desktop, numeración decorativa "01/06" gigante (hero `::after`, opacidad 0.045), ticker, barra de acento sobre `.section-title`, marcadores de remache en lista de contacto. Border-radius máximo 8 px en todo el sitio (`--radius-md`).

## 6. Estados por vista
- Formulario: `idle | invalid | loading | success(id) | error(400|429|5xx|network)` con retry en errores recuperables.
- Galería filtrable: `idle | vacío | éxito`.
- Mapa: `oculto (sin consentimiento) | preguntando (confirm nativo) | visible | fallback-enlace`.
- Tema: `oscuro | claro` (persistente).

## 7. Navegadores (`browserslist`)
Últimas 2 versiones de Chrome, Edge, Firefox, Safari, Safari iOS. `dvh` en móvil (hero usa `calc(100dvh - var(--header-h))`). `fetch` nativo. `color-mix()` CSS nivel 5 (soportado desde Chrome 111, Firefox 113, Safari 16.2 — dentro del rango). Sin polyfills.

## 8. Accesibilidad
HTML semántico, skip link, foco visible, labels asociados, `aria-describedby` en errores de formulario, `aria-live="polite"` en feedback, consentimiento con `aria-describedby`, botón enviar con `aria-disabled` sincronizado al atributo `disabled`, contraste AA en ambos temas, `alt` significativo en fotos (describen el motivo, no "imagen de"), respeta `prefers-reduced-motion` tanto en reveal como en transiciones. Target táctil ≥ 44 px (toggle, nav-toggle, filtros, checkbox 22 px pero con área clickable del label de 44 px por el flex grid).

## 9. Seguridad en el navegador
- Sin `innerHTML` con datos externos. Toda inserción dinámica es `textContent` / `createElement`.
- CSP de `vercel.json` compatible: `img-src 'self' data: https: blob:` permite Unsplash; `frame-src https://www.google.com https://maps.google.com` permite el iframe del mapa; `connect-src 'self'` permite `fetch` al mismo origen.
- `rel="noopener noreferrer"` en todos los enlaces externos.
- No se loggea PII a la consola.
- `MAPS_API_KEY` queda público pero restringido por dominio en Google Cloud; no es un secreto.
- Honeypot `website`: **el campo se envía siempre** (vacío o con el valor que haya metido un bot) y **la validación es exclusivamente del backend**, que descarta la petición si llega relleno. El cliente no lo evalúa ni lo filtra: así evitamos pistar al atacante y mantenemos un único punto de verdad (AU-M-03). El campo está oculto con CSS (`position: absolute; left: -9999px`), `tabindex="-1"` y `autocomplete="off"` para que un usuario real nunca lo complete.
- Sin `eval`, sin inline scripts, sin `dangerouslySetInnerHTML` (no aplica, no hay framework).

## 10. Rendimiento
- CSS en 2 hojas, carga síncrona (crítico, pero pequeño).
- JS con `defer` en 3 archivos.
- Fuentes con `font-display: swap` y preconnect a Google Fonts.
- Imágenes con `width`/`height` declarados, `loading="lazy"`, `decoding="async"`, `srcset` + `sizes`.
- Mapa diferido completamente (iframe no existe hasta consentimiento).
- Hero `::after` decoración puramente CSS (sin imagen).

## 11. Pruebas
Pendientes para la fase de testing (audit):
- Playwright E2E del envío de cotización, 3 motores.
- axe-core en `index.html` y `politica-privacidad.html`.
- Lighthouse Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.

## 12. Dispositivos (FE-15 — verificación)

Verificado en DevTools Chrome 141 (device toolbar) y simulación responsiva de Firefox 134. No hay sesión de QA en dispositivos físicos (nota: audit lo revisará).

| Ancho | Dispositivos de referencia | Resultado |
|-------|-----------------------------|-----------|
| 360 px | Galaxy S8+, Pixel 7 vertical | Hero una columna, nav colapsa, formulario una columna, targets ≥ 44 px, sin scroll horizontal. |
| 414 px | iPhone 14, iPhone 14 Pro Max estrecho | Igual al anterior; tipografía escala bien gracias a `clamp()`. |
| 768 px | iPad mini vertical | Servicios y proyectos pasan a 2 columnas, proceso 2×2, formulario pasa a 2 columnas, header muestra toggle de tema pero aún con hamburguesa. |
| 1024 px | iPad Air horizontal | Nav expandido, hero asimétrico (1.25/1), servicios y proyectos 3 columnas, proceso 4 columnas. |
| 1280 px | laptop/Chromebook | Container limitado a 1200 px, aire a ambos lados. |
| 1440 px | iPad Pro horizontal, monitor | Igual que 1280, el container queda centrado. |

Comprobaciones específicas en WebKit (iOS Safari):
- `100dvh` usado en hero → la altura responde al UI del navegador (barras ocultándose).
- `backdrop-filter` del header con `-webkit-backdrop-filter` como fallback.
- Inputs del formulario con `font-size: 16px` para evitar zoom automático en iOS.
- `color-scheme` declarado para que los inputs nativos (date, select) sigan el tema.

**Preparación E2E (R2, 2026-10-02).** Se añadieron `data-testid` estables en los selectores que Playwright necesitará para dirigir el flujo crítico, sin depender de clases de estilo que puedan cambiar: `field-nombre`, `field-telefono`, `field-email`, `field-servicio`, `field-mensaje`, `consent-checkbox`, `submit-quote`, `form-feedback`, `maps-consent-modal`, `maps-show`. Los selectores por rol accesible siguen siendo la primera opción; los `data-testid` son el fallback explícito.

## 13. Deltas detectados contra el resto del equipo

### Estado post-R2 (2026-10-02)

| ID | Estado | Nota |
|----|--------|------|
| AU-H-06 | **Resuelto R2** | `localStorage['mapsConsent']` guarda `CONFIG.MAPS_CONSENT_VERSION`. Al cambiar la versión, el consentimiento previo se invalida y se vuelve a pedir. |
| AU-M-03 | **Resuelto R2** | §9 clarifica que el honeypot `website` es validado **solo en servidor**; el cliente no lo evalúa. |
| AU-M-06 | **Resuelto R2** | Validación del teléfono relajada en cliente: acepta espacios, guiones, paréntesis, puntos y prefijo `+`; aplica `replace(/[^\d+]/g, '')` y exige ≥ 7 dígitos. El backend sigue siendo la autoridad. |
| AU-B-01 | **Resuelto R2** | `public/og-cover.jpg` 1200×630 generado con GDI+ (`scripts/generate-og-cover.ps1`). `index.html` referencia la URL relativa `/og-cover.jpg`. |

### Observaciones heredadas

- **Servicio enum.** El `select` del formulario ahora usa valores enum crudos (`residencial|comercial|industrial|portones|barandas|mobiliario|otro`) con etiquetas descriptivas en el option label. Antes mostraba el texto del servicio como `value`. Coherente con `backend/src/schemas/quote.ts` y `docs/contracts/data-model.md § F`.
- **`consentimiento_version`.** `governance/legal/texto-consentimiento.md` fija el valor literal `2026-10-02`. Lo tomo de `window.__MDC_CONFIG__.CONSENT_VERSION` para que coincida con el `CONSENT_VERSION` que el backend valide o acompañe. Si governance publica una nueva versión, debe cambiarlo también en `scripts/config.js`.
- **CSP de `vercel.json`.** La política admite `script-src 'unsafe-inline'`, pero este frontend igual evita inline. No requiere ajustes del archivo de devops.
- **CORS de `vercel.json`.** El header de `/api/*` tiene `Access-Control-Allow-Origin: https://[PENDIENTE_USUARIO: dominio]`. En producción debe quedar el dominio real. Mientras tanto, por el rewrite `/api/*` → `/backend/api/$1`, el mismo origen funciona sin CORS.
- **Puerto de `vercel dev`.** Documentado 3000 en README. Si el usuario tiene otro, se debe ajustar.
- **`og-cover.jpg` publicado (R2).** `og:image` ahora apunta a la ruta relativa `/og-cover.jpg`. `twitter:image` y JSON-LD mantienen URL absoluta a `metalurgicadelcaribe.co` (pendiente D1 dominio). Regeneración: `pwsh ./frontend/scripts/generate-og-cover.ps1`.
- **Coordenadas geo.** Aproximación `10.9878, -74.7889`. Si el dueño confirma otras, se cambia en el JSON-LD y en el embed del mapa (que usa el `q=` textual, no coordenadas).
- **`robots.txt` de devops.** Tiene `Sitemap: https://[PENDIENTE_USUARIO: dominio]/sitemap.xml` — delta propio de devops, no bloquea frontend.

## 14. Preguntas abiertas

- ¿El dueño prefiere seguir con fotos Unsplash o quiere que programemos una sesión de fotos del taller y los proyectos? Hoy están las de Unsplash; migración futura es solo cambiar `src`/`srcset` manteniendo `width`/`height`.
- Correo ARCO: ¿`datos@metalurgicadelcaribe.co` queda confirmado? Governance lo deja como sugerencia.
- ¿Modal propio para el consentimiento del mapa en vez de `confirm()` nativo? El nativo es accesible y lo suficientemente claro; se puede sofisticar más adelante.
- ¿Imagen OG definitiva o se diseña un render del taller?
