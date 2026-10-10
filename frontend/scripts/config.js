/**
 * config.js — Variables expuestas al cliente.
 *
 * No contiene secretos. Las claves son públicas (restringidas por dominio en el proveedor).
 *
 * El frontend y la API corren en el MISMO origen (los sirve server.js), tanto en
 * local (http://localhost:3000) como en Render. Por eso API_BASE_URL va vacío.
 */
(() => {
  'use strict';

  window.__MDC_CONFIG__ = {
    // Google Maps Embed API (clave pública, restringida por dominio). Si queda el
    // placeholder, el botón "Mostrar mapa" degrada a un enlace a maps.google.com.
    MAPS_API_KEY: 'MAPS_API_KEY_PLACEHOLDER',
    // Mismo origen: vacío. Si algún día el frontend se hostea aparte, pon aquí la
    // URL del backend (p. ej. https://puerta-samaria-api.onrender.com).
    API_BASE_URL: '',
    CONSENT_VERSION: '2026-10-02',
    // Versión del consentimiento específico de carga del mapa (Google Maps).
    // Si cambia, invalida localStorage['mapsConsent'] y vuelve a pedir permiso.
    MAPS_CONSENT_VERSION: '2026-10-02',
  };
})();
