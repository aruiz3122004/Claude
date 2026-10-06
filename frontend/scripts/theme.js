/**
 * theme.js — Gestor de modo claro/oscuro.
 *
 * Orden de resolución:
 *   1. localStorage.mdc-theme (si fue elegido por el usuario)
 *   2. prefers-color-scheme (si no hay preferencia guardada)
 *   3. default: 'dark'
 *
 * Sincroniza <meta name="theme-color"> con el token --meta-theme-color.
 * Respeta prefers-reduced-motion mediante tokens.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'mdc-theme';
  const root = document.documentElement;

  const readStored = () => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (_) {
      return null;
    }
  };

  const systemPrefers = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';

  const resolveInitial = () => readStored() || systemPrefers();

  const metaTheme = {
    dark: '#0E1116',
    light: '#F5F3EE',
  };

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    const meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', metaTheme[theme] || metaTheme.dark);

    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      );
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
  };

  // Primera aplicación lo antes posible.
  applyTheme(resolveInitial());

  // Toggle cuando el DOM esté listo.
  const bindToggle = () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (_) {
        /* storage no disponible, modo privado — se aplica solo en memoria */
      }
      applyTheme(next);
    });
  };

  // Reaccionar a cambios del sistema si el usuario no ha elegido.
  const bindSystem = () => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => {
      if (readStored()) return;
      applyTheme(e.matches ? 'light' : 'dark');
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindToggle();
      bindSystem();
    });
  } else {
    bindToggle();
    bindSystem();
  }
})();
