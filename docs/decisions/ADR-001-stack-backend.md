# ADR-001 — Stack backend: Node.js + Fastify + TypeScript + Zod

Fecha: 2026-10-02
Estado: aceptado

## Contexto
Se añade un backend ligero para recibir cotizaciones del formulario, persistirlas en Google Sheets y notificar por correo. El usuario pidió "un framework moderno para ahorrar líneas de código". El equipo es pequeño (1–2 personas); se necesita tipado estático, validación declarativa y bajo overhead.

## Decisión
**Node.js 20 LTS + Fastify 4 + TypeScript 5 + Zod** para validación.

## Alternativas descartadas
- **Hono** — más minimalista, pero su ecosistema de plugins maduros (Helmet, rate-limit, sensible, swagger) es menor que el de Fastify. Para un servicio con requisitos de seguridad explícitos, Fastify evita reinventar.
- **Express** — sin tipos nativos, más lento, middleware heterogéneo. No se gana nada.
- **NestJS** — sobredimensionado para dos endpoints; la DI añade fricción sin beneficio.
- **Go / Rust** — correctos técnicamente, pero añaden complejidad de operación y el equipo del cliente trabaja con JS.

## Consecuencias
- + Tipos end-to-end: Zod → tipos TS inferidos → handlers tipados.
- + Validación declarativa, errores consistentes.
- + Ecosistema de plugins maduro (Helmet, cors, rate-limit, pino).
- + Despliegue trivial en PaaS.
- − Un runtime Node en producción (vs sitio puramente estático).
- − Dependencia de npm; se mitiga con `npm audit` en CI.
