# favicons/ — Metalurgica del Caribe

Dueno de los archivos binarios: **frontend** (reutiliza el `brand-mark` SVG).
Dueno del manifest y rutas: **devops** (ya definidos).

## Archivos que debe generar frontend

Todos los PNG deben derivarse del `brand-mark` SVG actual, exportados sobre fondo transparente (salvo apple-touch-icon, que requiere fondo solido).

| Archivo | Tamano | Formato | Fondo | Uso |
|---------|--------|---------|-------|-----|
| `favicon.ico` | 16x16, 32x32, 48x48 (multi) | ICO | transparente | legacy, pestana del navegador |
| `favicon-16.png` | 16x16 | PNG | transparente | HTML link alterno |
| `favicon-32.png` | 32x32 | PNG | transparente | HTML link alterno |
| `apple-touch-icon.png` | 180x180 | PNG | **solido** `#0E1116` | iOS home screen |
| `icon-192.png` | 192x192 | PNG | transparente | PWA (Android) |
| `icon-512.png` | 512x512 | PNG | transparente | PWA splash |
| `icon-maskable-512.png` | 512x512 | PNG | solido `#0E1116`, logo al 80% del lienzo | PWA maskable (Android Adaptive) |

## Como generar

Opcion A (manual con una herramienta):
- https://realfavicongenerator.net/ (subir SVG, descargar paquete, mover archivos a este directorio).

Opcion B (CLI):
```
npx pwa-asset-generator ./frontend/assets/brand-mark.svg ./frontend/public/favicons \
  --manifest ./frontend/public/site.webmanifest \
  --background "#0E1116" \
  --padding "10%"
```

Opcion C (Sharp en script Node, cuando frontend tenga pipeline de assets).

## Como se referencian en el HTML

El `index.html` del frontend debe incluir en `<head>`:

```html
<link rel="icon" href="/favicons/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0E1116">
```

## Checklist de aceptacion

- [ ] Los 7 archivos existen en `frontend/public/favicons/`.
- [ ] `favicon.ico` abre correctamente en Chrome y Firefox.
- [ ] `apple-touch-icon.png` tiene fondo solido (no transparente): iOS no soporta transparencia.
- [ ] `icon-maskable-512.png` pasa el test en https://maskable.app/.
- [ ] Lighthouse PWA audit no reporta warnings de iconos.
