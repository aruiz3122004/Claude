/**
 * config.js — Variables de entorno expuestas al cliente.
 *
 * No contiene secretos. Las claves aquí son públicas (restringidas por dominio en el proveedor).
 * En build, un reemplazo textual (sed/esbuild define) sustituye los placeholders:
 *
 *   MAPS_API_KEY_PLACEHOLDER  → process.env.MAPS_API_KEY
 *   API_BASE_URL_PLACEHOLDER  → process.env.API_BASE_URL (vacío si mismo origen)
 *
 * Mientras no haya build, el frontend corre contra el mismo origen (vercel dev → /api/*).
 */
(() => {
  'use strict';
  window.__MDC_CONFIG__ = {
    MAPS_API_KEY: 'MAPS_API_KEY_PLACEHOLDER',
    // Frontend y API corren en el mismo origen (server.js sirve ambos).
    API_BASE_URL: '',
    CONSENT_VERSION: '2026-10-02',
    // Versión del consentimiento específico de carga del mapa (Google Maps).
    // Si cambia, invalida el valor almacenado en localStorage['mapsConsent']
    // y vuelve a pedir consentimiento al usuario (AU-H-06).
    MAPS_CONSENT_VERSION: '2026-10-02',
  };
})();
