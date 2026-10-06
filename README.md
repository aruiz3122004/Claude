# Metalurgica del Caribe

Sitio web + backend ligero para una empresa de herreria y metalisteria en Barranquilla. Captura cotizaciones reales en Google Sheets y notifica por correo al dueno.

> Arquitectura completa: `docs/ARCHITECTURE.md` (v2.0).
> Plan devops: `devops/PLAN.md`.
> Contratos: `docs/contracts/`.

## Stack

- **Frontend**: HTML/CSS/JS vanilla, estatico (`frontend/`).
- **Backend**: Node 20 + Fastify + TypeScript + Zod, desplegado como **Vercel Function** (`backend/api/*.ts`).
- **Persistencia**: Google Sheets (driver pluggable; Excel como alterno).
- **Correo**: Resend (SMTP como fallback).
- **Hosting**: Vercel (frontend estatico + funciones serverless en el mismo proyecto).
- **CI**: GitHub Actions (lint, typecheck, tests). Deploy automatico por integracion nativa Vercel+GitHub.

## Requisitos

| Sistema | Herramientas |
|---------|--------------|
| Todos | Node.js 20.x LTS, npm 10+, git |
| Windows | Opcional: WSL2 con Ubuntu 22.04 (recomendado para paridad con CI) |
| macOS | nvm o Volta recomendados para fijar la version de Node |
| Linux | Igual que macOS |

Instalar la CLI de Vercel para desarrollo local:
```
npm install -g vercel
```

## Setup inicial

1. Clonar el repo.
2. Copiar `.env.example` a `.env.local` y rellenar valores (ver `docs/contracts/env.md`).
3. Instalar dependencias:
   ```
   cd backend && npm ci && cd ..
   cd database && npm ci && cd ..
   ```
4. Login en Vercel y vincular el proyecto:
   ```
   vercel login
   vercel link
   ```
5. Importar las variables de entorno desde Vercel:
   ```
   vercel env pull .env.local
   ```

## Arrancar en local

Un solo comando levanta frontend + funciones serverless localmente:

```
vercel dev
```

Esto expone el sitio en `http://localhost:3000` con `/api/*` enrutado a las funciones TS.

### Windows sin WSL

Funciona igual, no se requiere make. PowerShell admite los mismos comandos.

### Alternativa: solo frontend sin backend

Para iterar HTML/CSS sin funciones:
```
cd frontend
npx http-server . -p 3000
```

## Comandos utiles

| Accion | Comando |
|--------|---------|
| Dev completo (front + api) | `vercel dev` |
| Lint backend | `cd backend && npm run lint` |
| Typecheck backend | `cd backend && npm run typecheck` |
| Tests backend | `cd backend && npm test` |
| Build local (equivale al de Vercel) | `vercel build` |
| Deploy preview manual | `vercel` |
| Deploy produccion manual | `vercel --prod` (uso excepcional; lo normal es push a `main`) |

## Despliegue

- **Preview**: cada PR genera una URL en `*.vercel.app` automaticamente.
- **Produccion**: push a `main` despliega al dominio productivo.
- Las variables de entorno viven en **Vercel UI** (Project Settings -> Environment Variables), nunca en el repo.

## Backups

GitHub Actions corre un cron semanal (`sheet-backup.yml`, domingos 03:00 UTC) que exporta la hoja `quotes` a CSV y la commitea a `backups/`. Requiere los secrets `SHEET_ID`, `SHEET_TAB` y `GOOGLE_SA_JSON` en GitHub.

## Observabilidad

- **Logs**: Vercel Logs (dashboard web).
- **Uptime**: UptimeRobot pollea `/api/healthz` y `/api/readyz` cada 5 min.
- **Metricas**: Vercel Analytics (Core Web Vitals, TTFB).

## Estructura

```
.
├── backend/              # Fastify + TS, expuesto como funciones Vercel bajo /api/*
├── database/             # Drivers de persistencia (Sheets, Excel)
├── frontend/             # Estatico (HTML/CSS/JS)
│   └── public/           # robots.txt, sitemap.xml, favicons/, site.webmanifest
├── devops/               # PLAN, DNS, Maps, runbooks
├── docs/                 # ARCHITECTURE.md, contratos, ADRs
├── governance/           # Politicas legales (Ley 1581)
├── .github/workflows/    # ci.yml, sheet-backup.yml
├── vercel.json           # Config de hosting, headers, rewrites
└── .env.example          # Nombres de variables (sin valores)
```

## Soporte

Para preguntas de arquitectura, abrir issue y etiquetar `architect`. Para incidentes de produccion, ver `devops/dns/README.md` seccion Runbook.
