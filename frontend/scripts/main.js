/**
 * main.js — Interacciones del sitio.
 *
 * - Menú móvil
 * - Filtro de proyectos
 * - Validación + envío real a POST /api/quotes (contrato: backend/src/schemas/quote.ts)
 * - Honeypot `website`
 * - Checkbox de consentimiento Ley 1581 (bloquea envío si no está marcado)
 * - Carga diferida del mapa de Google tras consentimiento del visitante
 * - Reveal on scroll (respeta prefers-reduced-motion)
 *
 * Sin dependencias en runtime. ES2020 vanilla.
 */
(() => {
  'use strict';

  const CONFIG = window.__MDC_CONFIG__ || {};
  const API_BASE = (CONFIG.API_BASE_URL || '').replace(/\/$/, '');
  const CONSENT_VERSION = CONFIG.CONSENT_VERSION || '2026-10-02';
  // Versión vigente del consentimiento de carga del mapa. Si no coincide
  // con lo persistido en localStorage['mapsConsent'], se vuelve a pedir (AU-H-06).
  const MAPS_CONSENT_VERSION = CONFIG.MAPS_CONSENT_VERSION || CONSENT_VERSION;

  // =============================================================
  // Video de fondo del hero
  // - Autoplay garantizado (muted + playsinline)
  // - Desbloqueo suave ante políticas estrictas del navegador
  // - Se pausa cuando el hero sale de pantalla para optimizar recursos
  // =============================================================
  const heroVideo = document.querySelector('.hero-bg-video');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;

    const playVideo = () => {
      const p = heroVideo.play();
      if (p !== undefined) {
        p.catch(() => {
          // Si el navegador bloqueó el autoplay sin interacción previa:
          const unlock = () => {
            heroVideo.play().catch(() => {});
            ['click', 'touchstart', 'scroll', 'keydown'].forEach((evt) => {
              window.removeEventListener(evt, unlock);
            });
          };
          ['click', 'touchstart', 'scroll', 'keydown'].forEach((evt) => {
            window.addEventListener(evt, unlock, { once: true, passive: true });
          });
        });
      }
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) {
      // Si el usuario tiene reducción de movimiento activa en el SO, mostramos el poster estático
      heroVideo.pause();
    } else {
      playVideo();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) playVideo(); else heroVideo.pause();
        }, { threshold: 0.05 }).observe(heroVideo);
      }
    }
  }

  // =============================================================
  // Mobile nav
  // =============================================================
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.setAttribute('data-open', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // =============================================================
  // Project filter
  // =============================================================
  const chips = document.querySelectorAll('.filter-chip');
  const projects = document.querySelectorAll('.project-card');
  const emptyMsg = document.getElementById('projectsEmpty');

  const applyFilter = (filter) => {
    let visible = 0;
    projects.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.hidden = !match;
      if (match) visible++;
    });
    if (emptyMsg) emptyMsg.hidden = visible > 0;
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      applyFilter(chip.dataset.filter);
    });
  });

  // =============================================================
  // Form: validación + envío real a POST /api/quotes
  // Reglas réplica de backend/src/schemas/quote.ts (QuoteInputSchema)
  // =============================================================
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');
  const consentCheckbox = document.getElementById('f-consent');
  const consentField = document.getElementById('consentField');

  const SERVICIO_ENUM = new Set([
    'playas', 'alojamiento', 'transporte',
    'gastronomia', 'paquete_completo', 'otro',
    'residencial', 'comercial', 'industrial',
    'portones', 'barandas', 'mobiliario',
  ]);

  // Email RFC-ligero coherente con z.string().email() de Zod.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Normalización permisiva alineada con lo que el backend acepta/normaliza (AU-M-06):
  // elimina espacios, guiones, paréntesis y puntos. Deja un posible prefijo `+`.
  // El backend es más estricto; aquí no bloqueamos entradas humanas razonables.
  const normalizeTelefono = (raw) => (raw || '').trim().replace(/[^\d+]/g, '');

  // Selector de indicativo (banderas vía flagcdn; los emoji de bandera no se ven en Windows)
  const COUNTRIES = [
    ['co', 'Colombia', '+57'], ['mx', 'México', '+52'], ['us', 'Estados Unidos', '+1'],
    ['ca', 'Canadá', '+1'], ['es', 'España', '+34'], ['ar', 'Argentina', '+54'],
    ['bo', 'Bolivia', '+591'], ['br', 'Brasil', '+55'], ['cl', 'Chile', '+56'],
    ['cr', 'Costa Rica', '+506'], ['cu', 'Cuba', '+53'], ['ec', 'Ecuador', '+593'],
    ['sv', 'El Salvador', '+503'], ['gt', 'Guatemala', '+502'], ['hn', 'Honduras', '+504'],
    ['ni', 'Nicaragua', '+505'], ['pa', 'Panamá', '+507'], ['py', 'Paraguay', '+595'],
    ['pe', 'Perú', '+51'], ['pr', 'Puerto Rico', '+1'], ['do', 'Rep. Dominicana', '+1'],
    ['uy', 'Uruguay', '+598'], ['ve', 'Venezuela', '+58'], ['de', 'Alemania', '+49'],
    ['fr', 'Francia', '+33'], ['it', 'Italia', '+39'], ['pt', 'Portugal', '+351'],
    ['gb', 'Reino Unido', '+44'], ['cn', 'China', '+86'],
  ];
  let phoneDial = '+57';
  (() => {
    const btn = document.getElementById('phoneCcBtn');
    const list = document.getElementById('phoneList');
    const flag = document.getElementById('phoneCcFlag');
    const code = document.getElementById('phoneCcCode');
    if (!btn || !list) return;
    COUNTRIES.forEach(([iso, name, dial]) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.dataset.iso = iso;
      li.dataset.dial = dial;
      li.innerHTML = `<img src="https://flagcdn.com/w40/${iso}.png" alt="" width="22" height="16" loading="lazy"><span>${name}</span><span class="dial">${dial}</span>`;
      if (iso === 'co') li.setAttribute('aria-selected', 'true');
      list.appendChild(li);
    });
    const close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      list.hidden = !list.hidden;
      btn.setAttribute('aria-expanded', String(!list.hidden));
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      phoneDial = li.dataset.dial;
      flag.src = `https://flagcdn.com/w40/${li.dataset.iso}.png`;
      code.textContent = phoneDial;
      list.querySelectorAll('li').forEach((x) => x.removeAttribute('aria-selected'));
      li.setAttribute('aria-selected', 'true');
      close();
      document.getElementById('f-telefono').focus();
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#phoneGroup')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  })();
  const fullTelefono = (raw) => {
    const n = normalizeTelefono(raw);
    return n.startsWith('+') ? n : phoneDial + n.replace(/^0+/, '');
  };

  const validators = {
    nombre: (v) => {
      const t = (v || '').trim();
      return t.length >= 2 && t.length <= 120;
    },
    telefono: (v) => {
      // Cliente permisivo: tras despojar separadores (espacios, guiones,
      // paréntesis, puntos), exige al menos 7 dígitos. La validación estricta
      // (prefijo +57, longitud exacta) la aplica el backend (AU-M-06).
      const cleaned = normalizeTelefono(v);
      const digits = cleaned.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15 && /^\+?\d+$/.test(cleaned);
    },
    email: (v) => {
      const t = (v || '').trim();
      return t.length <= 254 && EMAIL_RE.test(t);
    },
    servicio: (v) => SERVICIO_ENUM.has((v || '').trim()),
    mensaje: (v) => {
      const t = (v || '').trim();
      return t.length >= 10 && t.length <= 2000;
    },
  };

  const setFieldError = (input, hasError) => {
    const field = input.closest('.field');
    if (!field) return;
    field.setAttribute('data-invalid', String(hasError));
    input.setAttribute('aria-invalid', String(hasError));
  };

  const validateField = (input) => {
    const check = validators[input.name];
    if (!check) return true;
    const ok = check(input.value);
    setFieldError(input, !ok);
    return ok;
  };

  const setFeedback = (state, msg, { allowRetry = false } = {}) => {
    if (!feedback) return;
    feedback.setAttribute('data-state', state);
    // textContent para evitar inyección HTML.
    feedback.textContent = msg || '';
    if (allowRetry) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'retry';
      btn.textContent = 'Reintentar envío';
      btn.addEventListener('click', () => {
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      });
      feedback.appendChild(document.createElement('br'));
      feedback.appendChild(btn);
    }
  };

  const clearFeedback = () => {
    if (!feedback) return;
    feedback.removeAttribute('data-state');
    feedback.textContent = '';
  };

  const updateSubmitEnabled = () => {
    if (!submitBtn) return;
    const consentOk = !!(consentCheckbox && consentCheckbox.checked);
    submitBtn.disabled = !consentOk;
    submitBtn.setAttribute('aria-disabled', String(!consentOk));
  };

  if (consentCheckbox) {
    consentCheckbox.addEventListener('change', () => {
      if (consentField) consentField.setAttribute('data-invalid', consentCheckbox.checked ? 'false' : 'true');
      updateSubmitEnabled();
    });
    updateSubmitEnabled();
  }

  if (form) {
    const fields = form.querySelectorAll('input[name], select[name], textarea[name]');
    const dataFields = Array.from(fields).filter(
      (f) => f.name !== 'website' && f.name !== 'consentimiento'
    );

    dataFields.forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && field.getAttribute('data-invalid') === 'true') {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1) validación cliente campo a campo
      let allValid = true;
      let firstInvalid = null;
      dataFields.forEach((input) => {
        const ok = validateField(input);
        if (!ok) {
          allValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      // 2) consentimiento obligatorio
      const consentOk = !!(consentCheckbox && consentCheckbox.checked);
      if (!consentOk) {
        if (consentField) consentField.setAttribute('data-invalid', 'true');
        allValid = false;
        if (!firstInvalid) firstInvalid = consentCheckbox;
      }

      if (!allValid) {
        setFeedback('error', 'Revise los campos marcados en rojo antes de enviar.');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // 3) construir payload (strict schema)
      const fd = new FormData(form);
      const payload = {
        nombre: String(fd.get('nombre') || '').trim(),
        telefono: fullTelefono(fd.get('telefono')),
        email: String(fd.get('email') || '').trim().toLowerCase(),
        servicio: String(fd.get('servicio') || '').trim(),
        mensaje: String(fd.get('mensaje') || '').trim(),
        origen: 'web-landing',
        consentimiento: true,
        consentimiento_version: CONSENT_VERSION,
        website: String(fd.get('website') || ''), // honeypot, debe ir vacío
      };

      // 4) envío
      setFeedback('loading', 'Enviando su solicitud…');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-disabled', 'true');
      }

      try {
        const resp = await fetch(`${API_BASE}/api/quotes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (resp.status === 202) {
          setFeedback(
            'success',
            'Tu solicitud fue registrada. Te contactamos en el día hábil siguiente.'
          );
          form.reset();
          dataFields.forEach((input) => setFieldError(input, false));
          if (consentField) consentField.setAttribute('data-invalid', 'false');
          updateSubmitEnabled();
          // mantiene foco accesible en el mensaje de éxito
          if (feedback) {
            feedback.setAttribute('tabindex', '-1');
            feedback.focus({ preventScroll: false });
          }
          return;
        }

        if (resp.status === 400) {
          setFeedback(
            'error',
            'Algunos datos no son válidos. Revise los campos del formulario y vuelva a intentar.'
          );
        } else if (resp.status === 429) {
          setFeedback(
            'error',
            'Has enviado varias solicitudes seguidas. Esperá un minuto antes de reintentar.'
          );
        } else if (resp.status >= 500) {
          setFeedback(
            'error',
            'El servicio no está disponible en este momento. Tu información no se envió.',
            { allowRetry: true }
          );
        } else {
          setFeedback(
            'error',
            `Error inesperado (${resp.status}). Intente de nuevo o escríbanos por WhatsApp.`,
            { allowRetry: true }
          );
        }
      } catch (err) {
        // Fallo de red — no se perdió lo escrito (no se hace form.reset()).
        setFeedback(
          'error',
          'No se pudo conectar con el servidor. Revise su conexión y reintente.',
          { allowRetry: true }
        );
      } finally {
        updateSubmitEnabled();
      }
    });
  }

  // =============================================================
  // Google Maps diferido tras consentimiento
  // =============================================================
  const mapWrap = document.getElementById('mapWrap');
  const mapPlaceholder = document.getElementById('mapPlaceholder');
  const mapShowBtn = document.getElementById('mapShowBtn');

  // Elementos del modal de consentimiento personalizado
  const consentModal = document.getElementById('consentModal');
  const consentAcceptBtn = document.getElementById('consentAcceptBtn');
  const consentDeclineBtn = document.getElementById('consentDeclineBtn');
  const consentCloseBtn = document.getElementById('consentCloseBtn');
  const consentRemember = document.getElementById('consentRemember');

  // El valor almacenado es la versión vigente del consentimiento, no un literal
  // `'accepted'`. Si la versión cambia (nueva política), el consentimiento
  // previo deja de ser válido y se vuelve a preguntar (AU-H-06).
  const hasMapConsent = () => {
    try {
      return window.localStorage.getItem('mapsConsent') === MAPS_CONSENT_VERSION;
    } catch (_) {
      return false;
    }
  };

  const setMapConsent = () => {
    try { window.localStorage.setItem('mapsConsent', MAPS_CONSENT_VERSION); } catch (_) {}
  };

  const openConsentModal = () => {
    if (!consentModal) return;
    consentModal.setAttribute('data-open', 'true');
    consentModal.setAttribute('aria-hidden', 'false');
    if (consentAcceptBtn) consentAcceptBtn.focus();
  };

  const closeConsentModal = () => {
    if (!consentModal) return;
    consentModal.setAttribute('data-open', 'false');
    consentModal.setAttribute('aria-hidden', 'true');
    if (mapShowBtn) mapShowBtn.focus();
  };

  const injectMap = () => {
    if (!mapWrap) return;
    if (mapWrap.querySelector('iframe')) return;

    const apiKey = (CONFIG.MAPS_API_KEY && CONFIG.MAPS_API_KEY !== 'MAPS_API_KEY_PLACEHOLDER')
      ? CONFIG.MAPS_API_KEY
      : '';

    // Si hay API key configurada, usamos Google Maps Embed API v1;
    // de lo contrario usamos el embed público directo de Google Maps para vista previa instantánea sin bloqueo
    let embedSrc = '';
    if (apiKey) {
      embedSrc = 'https://www.google.com/maps/embed/v1/place?key=' +
        encodeURIComponent(apiKey) +
        '&q=' +
        encodeURIComponent('Centro Histórico Santa Marta Magdalena Colombia');
    } else {
      embedSrc = 'https://maps.google.com/maps?q=' +
        encodeURIComponent('Centro Histórico, Santa Marta, Magdalena, Colombia') +
        '&t=&z=15&ie=UTF8&iwloc=&output=embed';
    }

    const iframe = document.createElement('iframe');
    iframe.src = embedSrc;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'Ubicación de Puerta Samaria en Santa Marta');

    if (mapPlaceholder) {
      mapPlaceholder.remove();
    }
    mapWrap.appendChild(iframe);
  };

  if (mapShowBtn) {
    if (hasMapConsent()) {
      injectMap();
    }
    mapShowBtn.addEventListener('click', () => {
      if (hasMapConsent()) {
        injectMap();
      } else {
        openConsentModal();
      }
    });
  }

  if (consentAcceptBtn) {
    consentAcceptBtn.addEventListener('click', () => {
      if (consentRemember && consentRemember.checked) {
        setMapConsent();
      }
      closeConsentModal();
      injectMap();
    });
  }

  if (consentDeclineBtn) {
    consentDeclineBtn.addEventListener('click', () => {
      closeConsentModal();
      window.open('https://www.google.com/maps/search/?api=1&query=Centro+Hist%C3%B3rico+Santa+Marta+Magdalena+Colombia', '_blank', 'noopener,noreferrer');
    });
  }

  if (consentCloseBtn) {
    consentCloseBtn.addEventListener('click', () => {
      closeConsentModal();
    });
  }

  if (consentModal) {
    consentModal.addEventListener('click', (e) => {
      if (e.target === consentModal) {
        closeConsentModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && consentModal.getAttribute('data-open') === 'true') {
        closeConsentModal();
      }
    });
  }

  // =============================================================
  // Reveal on scroll
  // =============================================================
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealables = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealables.forEach((el) => io.observe(el));
  }

  // =============================================================
  // Year
  // =============================================================
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
