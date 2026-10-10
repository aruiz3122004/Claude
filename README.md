# Puerta Samaria

Sitio web de una agencia de turismo en Santa Marta. Es una página estática más una
pequeña API que recibe las reservas del formulario y las guarda en Turso (Base de datos en la nube basada en sqlite).

Todo corre en **un único servicio de Node** (`server.js`): sirve el frontend y responde
`/api/*` en el mismo origen. Sin frameworks, sin build y sin dependencias.

> Despliegue en **Render** con `render.yaml`. No hay configuración de Vercel.

## Dependencias

**Ninguna.** El proyecto no instala paquetes npm; solo usa módulos integrados de Node:

| Módulo | Para qué |
|--------|----------|
| `node:http` | Servidor HTTP y enrutado |
| `node:sqlite` | Base de datos (`DatabaseSync`) |
| `node:fs` / `node:path` | Archivos estáticos y rutas |
| `node:crypto` | Generación de IDs de reserva |

Único requisito: **Node.js 20 o superior** (por `node:sqlite`). Declarado en
`package.json` → `"engines": { "node": ">=20.0.0" }`.

## Requisitos

- Node.js 20+ (LTS recomendado).
- No hace falta `npm install` (no hay dependencias).

## Arrancar en local

```powershell
npm run dev
```

o directamente:

```powershell
node server.js
```

El sitio queda en http://localhost:3000 (cambiable con la variable `PORT`).

## Scripts

| Acción | Comando |
|--------|---------|
| Arrancar el servidor | `npm run dev` / `npm start` (ambos = `node server.js`) |
| Ver las reservas por consola | `npm run ver-reservas` |
| Inicializar la base de datos | `node scripts/init-db.js` |

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` + estáticos | Landing, CSS, JS, imágenes… (desde `frontend/`) |
| GET | `/api/healthz` | Estado del servicio y ruta de la base |
| POST | `/api/quotes` | Crea una reserva (JSON) |

Ejemplo:

```powershell
curl -X POST http://localhost:3000/api/quotes `
  -H "Content-Type: application/json" `
  -d '{\"nombre\":\"Ana\",\"telefono\":\"3001234567\",\"email\":\"ana@example.com\",\"servicio\":\"tour\",\"mensaje\":\"Hola\"}'
```

- **Obligatorios**: `nombre`, `telefono`, `email`. **Opcionales**: `servicio`, `mensaje`, `origen`.
- **Respuestas**: `202` (recibida, con `id`), `400` (validación), `413` (cuerpo > 32 KiB),
  `429` (demasiadas peticiones), `500` (error interno).
- **Defensas**: rate limit en memoria (15 peticiones / 5 min por IP), honeypot
  (campo `website`) y límite de cuerpo de 32 KiB.

## Base de datos

SQLite en `data/reservas.db` (se crea automáticamente al arrancar). Tabla `reservas`:

| Columna | Descripción |
|---------|-------------|
| `id` | `RSV-…` (clave primaria) |
| `timestamp` | Fecha ISO 8601 (UTC) |
| `nombre`, `telefono`, `email` | Datos de contacto |
| `servicio`, `mensaje` | Detalle de la solicitud |
| `origen` | Origen del envío (`web-landing` por defecto) |
| `estado` | Estado de la reserva (`pendiente` por defecto) |

`npm run ver-reservas` imprime las reservas en tarjetas y en tabla.

### Persistencia (importante en hosting)

- En local el archivo vive en `./data/`.
- Se puede cambiar la carpeta con la variable `DATA_DIR` (p. ej. un disco de Render en `/var/data`).
- Si el sistema de archivos es de solo lectura, `server.js` cae a `/tmp` (efímero).
- **En el plan gratuito de Render el disco es efímero**: las reservas se pierden en
  cada deploy o reinicio. Para conservarlas hay que montar un disco persistente
  (planes de pago) y definir `DATA_DIR` a su punto de montaje (ver `render.yaml`).

## SEO

- `frontend/robots.txt` → se sirve en `/robots.txt` (permite todo, bloquea `/api/` y
  declara el sitemap).
- `frontend/sitemap.xml` → se sirve en `/sitemap.xml` (home + política de privacidad).
- Canonical, `og:url` y JSON-LD del HTML usan `https://puertasamaria.com/`.

Puesta en marcha en Google:

1. Configura el dominio en Render (**Settings → Custom Domain**) para que
   `https://puertasamaria.com` resuelva al servicio.
2. Si todavía usas el dominio `*.onrender.com`, actualiza el dominio en
   `frontend/robots.txt`, `frontend/sitemap.xml` y los `<link rel="canonical">`.
3. Da de alta el sitio en [Google Search Console](https://search.google.com/search-console)
   y envía `https://puertasamaria.com/sitemap.xml`.
4. Al cambiar el contenido de una página, actualiza su `<lastmod>` en `sitemap.xml`.

## Despliegue en Render

El repo incluye `render.yaml` (Blueprint) con un único web service.

1. Render → **New → Blueprint** → conecta el repositorio.
2. Render lee `render.yaml` y despliega:
   - **Build**: `npm install` · **Start**: `node server.js`
   - **Health check**: `/api/healthz`
   - **Puerto**: lo inyecta Render en `PORT` (el servidor ya lo lee).
3. Cada push a `main` redespliega automáticamente (`autoDeploy: true`).

No se necesitan variables de entorno ni secretos.

## Estructura

```
.
├── server.js            # Servidor HTTP: estáticos + API (/api/quotes, /api/healthz)
├── render.yaml          # Blueprint de despliegue en Render
├── package.json         # Scripts (dev, start, ver-reservas)
├── scripts/
│   ├── init-db.js       # Crea la tabla reservas
│   └── ver-reservas.js  # Lista las reservas por consola
├── frontend/            # Sitio estático (ver frontend/README.md)
│   ├── index.html
│   ├── politica-privacidad.html
│   ├── robots.txt       # SEO → /robots.txt
│   ├── sitemap.xml      # SEO → /sitemap.xml
│   ├── assets/
│   ├── public/          # favicons, site.webmanifest, og-cover
│   ├── styles/
│   └── scripts/
├── data/                # Base SQLite (no versionada)
├── docs/ audit/ governance/   # Documentación histórica y legal
└── .env.example         # Variables opcionales (todas con valor por defecto)
```

## Notas

- La arquitectura anterior (Vercel Functions + Google Sheets + Fastify en `backend/`
  y `database/`) se eliminó por completo; ya no hay dependencias ni configuración de Vercel.
- `docs/`, `audit/` y `governance/` se conservan como documentación histórica y legal.


## Actualización

- Configuré la base de datos, pasando de SQLite, que solo traía datos locales a una db en la nube, llamada Turso, que permite conectarse y obtener datos desde cualquier lugar, y es gratuita, está basada en SQLite...