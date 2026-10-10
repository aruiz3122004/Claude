# frontend — Puerta Samaria

Sitio estático en HTML/CSS/JS vanilla (ES2020). Sin framework, sin build y sin
dependencias en runtime.

## Cómo se sirve

`server.js` (en la raíz del repo) sirve esta carpeta como estáticos y responde la
API en `/api/*`, todo en el mismo origen. Con el servidor arrancado:

- Local: http://localhost:3000/
- Render: https://<servicio>.onrender.com/ (o el dominio configurado)

```powershell
# Desde la raíz del repo
npm run dev
```

El formulario envía a `POST /api/quotes` contra el mismo origen (`API_BASE_URL: ''`
en `scripts/config.js`). Si el frontend se hosteara por separado, habría que poner
la URL absoluta del backend en `API_BASE_URL`.

## Estructura

```
frontend/
├── index.html                    # landing (todas las secciones)
├── politica-privacidad.html      # política Ley 1581 (publicada)
├── robots.txt                    # SEO → servido en /robots.txt
├── sitemap.xml                   # SEO → servido en /sitemap.xml
├── assets/                       # imágenes y marca (brand-mark.svg, fondo)
├── public/                       # favicons, site.webmanifest, og-cover
├── styles/
│   ├── tokens.css                # design tokens (modo claro/oscuro)
│   └── main.css                  # componentes y layout
├── scripts/
│   ├── config.js                 # claves públicas (Maps, API base, consentimiento)
│   ├── theme.js                  # modo claro/oscuro
│   ├── main.js                   # nav, formulario, mapa diferido
│   └── generate-favicons.ps1     # regenera PNG + ICO desde brand-mark
└── README.md
```

## Decisiones clave

- **Sin framework.** Landing informativa con un formulario; no hay rutas internas
  que justifiquen un bundle.
- **Mobile-first.** Breakpoints 360 / 414 / 768 / 1024 / 1280 / 1440.
- **Dark por defecto + modo claro opcional.** Tokens semánticos en `tokens.css`,
  `data-theme` en `<html>`, persistido en `localStorage` (`mdc-theme`).
- **Accesible (WCAG 2.2 AA).** Skip link, foco visible, labels asociados,
  `aria-live` en el feedback y respeto a `prefers-reduced-motion`.
- **Ley 1581 en cliente.** Checkbox de consentimiento no premarcado, envío
  deshabilitado hasta marcarlo, versión del aviso enviada como `consentimiento_version`.
- **Google Maps diferido.** El iframe no se carga hasta que el visitante lo acepta;
  la preferencia se guarda en `localStorage.mapsConsent`.

## SEO

- `robots.txt` y `sitemap.xml` viven aquí y se sirven desde la raíz del dominio.
- Canonical, `og:url` y JSON-LD usan `https://puertasamaria.com/`. Si cambia el
  dominio, actualizar esos valores y las URLs del sitemap.

## Favicons / OG

```powershell
pwsh ./frontend/scripts/generate-favicons.ps1
```

Genera los íconos en `public/favicons/`. La imagen Open Graph (`public/og-cover.jpg`)
se regenera con `pwsh ./frontend/scripts/generate-og-cover.ps1`.
