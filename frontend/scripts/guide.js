/**
 * Guía Virtual Interactivo — Carlos (Puerta Samaria)
 * Acompañamiento local en vivo para turistas en Santa Marta.
 */
(function initVirtualGuide() {
  const guideContainer = document.getElementById('virtualGuide');
  const speechBubble = document.getElementById('guideSpeechBubble');
  const avatarBtn = document.getElementById('guideAvatarBtn');
  const chatPanel = document.getElementById('guideChatPanel');
  const closeChatBtn = document.getElementById('guideCloseChatBtn');
  const chatMessages = document.getElementById('guideChatMessages');
  const chatForm = document.getElementById('guideChatForm');
  const chatInput = document.getElementById('guideChatInput');
  const bubbleCloseBtn = document.getElementById('guideBubbleClose');

  if (!guideContainer) return;

  const PHONE_DISPLAY = '+57 300 748 7142';
  const PHONE_RAW = '573007487142';
  const WA_BASE = `https://wa.me/${PHONE_RAW}?text=`;

  // Base de conocimiento de Santa Marta y Puerta Samaria
  const PLACES = [
    {
      name: 'Cabo San Juan (Tayrona)',
      desc: 'Playa icónica con mirador en las rocas y piscina natural.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Cabo+San+Juan+del+Guia+Parque+Tayrona+Santa+Marta'
    },
    {
      name: 'Bahía Concha',
      desc: 'Aguas cristalinas, ambiente familiar y acceso por tierra o lancha.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Bahia+Concha+Santa+Marta+Magdalena'
    },
    {
      name: 'Playa Cristal & Neguanje',
      desc: 'Arrecifes de coral, snorkel de primera y aguas transparentes.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Playa+Cristal+Parque+Tayrona+Santa+Marta'
    },
    {
      name: 'Taganga & Playa Grande',
      desc: 'Pueblo tradicional de pescadores, lanchas y escuelas de buceo.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Taganga+Santa+Marta+Magdalena'
    },
    {
      name: 'El Rodadero & Playa Blanca',
      desc: 'Playa blanca y acuario marino a 10 min en lancha de la ciudad.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Playa+Blanca+El+Rodadero+Santa+Marta'
    },
    {
      name: 'Oficina Puerta Samaria',
      desc: 'Carrera 1C # 22-18, Centro Histórico de Santa Marta.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Centro+Historico+Santa+Marta+Carrera+1C'
    }
  ];

  function buildWaLink(query) {
    const text = encodeURIComponent(`Hola Carlos, tengo una consulta sobre: ${query}`);
    return `${WA_BASE}${text}`;
  }

  // Generador de respuestas inteligentes
  function generateResponse(userText) {
    const lower = userText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. Precios / Costos / Tarifas
    if (lower.match(/precio|costo|cuanto|tarifa|valor|cotiz|cobro|presupuesto|paquete vale/)) {
      const waUrl = buildWaLink("Precios y cotización de planes en Santa Marta");
      return `
        <p><strong>Para información sobre precios y lugares, contactar con este número:</strong> <a href="tel:+573007487142" class="guide-phone-link">${PHONE_DISPLAY}</a>.</p>
        <p>Nuestros planes son personalizados y sin intermediarios informales ni sobrecostos. Puedes escribirnos directamente al WhatsApp:</p>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="guide-action-btn guide-wa-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
          Abrir chat en WhatsApp (${PHONE_DISPLAY})
        </a>
      `;
    }

    // 2. Lugares / Playas / Dónde ir / Ubicaciones
    if (lower.match(/lugar|lugares|playa|playas|donde ir|donde queda|ubicacion|ubicaciones|mapa|tayrona|concha|cristal|taganga|rodadero/)) {
      const placesList = PLACES.map(p => `
        <li class="guide-place-item">
          <strong>${p.name}:</strong> ${p.desc}
          <a href="${p.maps}" target="_blank" rel="noopener noreferrer" class="guide-maps-link">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-7.5-8-13a8 8 0 1116 0c0 5.5-8 13-8 13z"/><circle cx="12" cy="9" r="3"/></svg>
            Ver en Google Maps
          </a>
        </li>
      `).join('');

      return `
        <p>¡Santa Marta tiene las playas más hermosas de Colombia! Aquí tienes los lugares más destacados con ubicación directa en Google Maps:</p>
        <ul class="guide-places-list">${placesList}</ul>
        <p style="margin-top:8px;"><strong>Para información sobre precios y lugares, contactar con este número:</strong> <a href="tel:+573007487142" class="guide-phone-link">${PHONE_DISPLAY}</a>.</p>
        <a href="${buildWaLink("Coordinar visita a playas en Santa Marta")}" target="_blank" rel="noopener noreferrer" class="guide-action-btn guide-wa-btn">
          Chatear por WhatsApp
        </a>
      `;
    }

    // 3. Servicios / Hoteles / Hospedaje / Lanchas / Transporte / Gastronomía
    if (lower.match(/servicio|hospedaje|hotel|cabana|alojamiento|lancha|transporte|restaurante|comida|gastronomia|acompanamiento/)) {
      return `
        <p>En <strong>Puerta Samaria</strong> te ofrecemos acompañamiento completo en Santa Marta:</p>
        <ul style="padding-left:18px; margin: 6px 0 10px; font-size:13px; line-height: 1.5;">
          <li>🌊 <strong>Excursiones & Playas:</strong> Cabo San Juan, Bahía Concha, Playa Cristal y Taganga.</li>
          <li>🏨 <strong>Hospedaje:</strong> Hoteles boutique en el Centro y eco-cabañas frente al mar.</li>
          <li>🚤 <strong>Transporte:</strong> Lanchas con tripulación certificada y traslados privados desde el aeropuerto.</li>
          <li>🍤 <strong>Gastronomía costeña:</strong> Recomendaciones y reservas en los mejores restaurantes.</li>
          <li>🛡️ <strong>Acompañamiento 24/7:</strong> Cero abusos en precios, te cuidamos durante toda tu estadía.</li>
        </ul>
        <p><strong>Para información sobre precios y lugares, contactar con este número:</strong> <a href="tel:+573007487142" class="guide-phone-link">${PHONE_DISPLAY}</a>.</p>
        <a href="${buildWaLink("Información de servicios y paquetes")}" target="_blank" rel="noopener noreferrer" class="guide-action-btn guide-wa-btn">
          Consultar por WhatsApp
        </a>
      `;
    }

    // 4. Quiénes son / Empresa / Seguridad
    if (lower.match(/quienes son|agencia|empresa|puerta samaria|seguridad|estafa|formal|oficina/)) {
      return `
        <p>Somos <strong>PUERTA SAMARIA S.A.S.</strong>, agencia anfitriona formalmente establecida en Santa Marta. Funcionamos como intermediarios de confianza para que los turistas no caigan en trampas informales ni tarifas infladas.</p>
        <p>Nuestra oficina está en la <strong>Carrera 1C # 22-18, Centro Histórico de Santa Marta</strong>.</p>
        <a href="https://www.google.com/maps/search/?api=1&query=Centro+Historico+Santa+Marta+Carrera+1C" target="_blank" rel="noopener noreferrer" class="guide-maps-link" style="display:inline-flex;margin-bottom:8px;">
          Ver oficina en Google Maps
        </a>
        <p><strong>Para información sobre precios y lugares, contactar con este número:</strong> <a href="tel:+573007487142" class="guide-phone-link">${PHONE_DISPLAY}</a>.</p>
      `;
    }

    // 5. Saludo general o respuesta por defecto
    if (lower.match(/hola|buenos dias|buenas tardes|buenas noches|hey|que tal/)) {
      return `
        <p>¡Hola! Qué gusto saludarte. Soy Carlos, tu asesor local en Santa Marta 🌊☀️.</p>
        <p>Puedo ayudarte con información sobre playas del Tayrona, reservas de hoteles, transporte náutico o restaurantes.</p>
        <p><strong>Para información sobre precios y lugares, contactar con este número:</strong> <a href="tel:+573007487142" class="guide-phone-link">${PHONE_DISPLAY}</a>.</p>
        <a href="${buildWaLink("Hola Carlos, quiero planear mi viaje")}" target="_blank" rel="noopener noreferrer" class="guide-action-btn guide-wa-btn">
          Escribir por WhatsApp
        </a>
      `;
    }

    // Respuesta por defecto con directriz obligatoria
    return `
      <p><strong>¡Nos ubicamos en:</strong> Carrera 1C # 22-18, Centro Histórico, Santa Marta, Magdalena</p>
      <p><strong>Para información sobre precios y lugares, contactar con este número:</strong> <a href="tel:+573007487142" class="guide-phone-link">${PHONE_DISPLAY}</a>.</p>
      <a href="${buildWaLink(userText)}" target="_blank" rel="noopener noreferrer" class="guide-action-btn guide-wa-btn">
        Continuar consulta en WhatsApp
      </a>
    `;
  }

  function appendMessage(sender, htmlContent) {
    const msgEl = document.createElement('div');
    msgEl.className = `guide-msg guide-msg-${sender}`;
    msgEl.innerHTML = htmlContent;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function openChat() {
    guideContainer.classList.add('chat-open');
    speechBubble.classList.add('bubble-hidden');
    chatPanel.setAttribute('aria-hidden', 'false');
    setTimeout(() => chatInput?.focus(), 200);
  }

  function closeChat() {
    guideContainer.classList.remove('chat-open');
    chatPanel.setAttribute('aria-hidden', 'true');
  }

  // Interacción de clic en Carlos o en el globo
  avatarBtn?.addEventListener('click', () => {
    if (guideContainer.classList.contains('chat-open')) {
      closeChat();
    } else {
      openChat();
    }
  });

  speechBubble?.addEventListener('click', (e) => {
    if (e.target.closest('#guideBubbleClose')) {
      e.stopPropagation();
      speechBubble.classList.add('bubble-hidden');
      return;
    }
    openChat();
  });

  bubbleCloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    speechBubble.classList.add('bubble-hidden');
  });

  closeChatBtn?.addEventListener('click', closeChat);

  // Manejo de envío de preguntas
  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    // Mensaje del usuario
    appendMessage('user', `<p>${escapeHtml(query)}</p>`);
    chatInput.value = '';

    // Carlos responde con pequeño delay natural
    setTimeout(() => {
      const responseHtml = generateResponse(query);
      appendMessage('guide', responseHtml);
    }, 350);
  });

  // Botones de sugerencias rápidas en el chat
  document.querySelectorAll('.guide-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-question') || btn.textContent.trim();
      appendMessage('user', `<p>${escapeHtml(q)}</p>`);
      setTimeout(() => {
        const responseHtml = generateResponse(q);
        appendMessage('guide', responseHtml);
      }, 300);
    });
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Escuchar tecla ESC para cerrar el chat
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && guideContainer.classList.contains('chat-open')) {
      closeChat();
    }
  });
})();
