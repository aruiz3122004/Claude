# ADR-003 — Hosting

Fecha: 2026-10-02
Estado: aceptado

## Contexto
Se necesita hosting para un frontend estático y un backend Node pequeño, con HTTPS y despliegue simple. Equipo de 1–2 personas, presupuesto bajo, baja escala.

## Decisión
- **Frontend:** CDN estática (Netlify, Vercel o Cloudflare Pages — devops elige por costo/latencia desde Colombia).
- **Backend:** PaaS con contenedor Docker (Render, Fly.io o Railway — devops elige).
- **Dominio:** `metalurgicadelcaribe.co` (confirmar con usuario) con `api.` para backend.

## Alternativas descartadas
- **Kubernetes** — sobreingeniería total para un servicio.
- **AWS Lambda** — frío + latencia Sheets no justifica serverless.
- **VPS crudo** — carga operativa innecesaria (TLS, parches, monitoreo manual).

## Consecuencias
- + Despliegue en minutos, HTTPS automático, CI integrado.
- + Costo < 20 USD/mes.
- − Dependencia del PaaS; se mitiga con Dockerfile portable.

## Residencia de datos
Sheets y proveedor de correo determinan dónde residen los datos. Governance documenta esto en la política de privacidad.
