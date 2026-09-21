const CONFIG = {
  totalKm: 2750,
};

// Reemplaza estas frases cuando tengas los mensajes definitivos.
const flowerMessages = [
  'Te extraño y te pienso todos los días, incluso en los momentos más simples.',
  'La distancia solo hace que tenga más ganas de nuestro primer abrazo.',
  'Tu sonrisa siempre encuentra la forma de iluminarme.',
  'Te elegiría a ti, una y mil veces, sin importar los kilómetros.',
  'Estas flores durarán un momento; lo que siento por ti, muchísimo más.',
];

// Cartas de la sección "Sobres para cuando me extrañes".
const cartas = [
  {
    id: 1,
    etiqueta: 'Abre cuando la distancia se sienta pesada 💌',
    titulo: 'Para esos días de distancia...',
    contenido: 'Si estás leyendo esto es porque hoy los kilómetros pesan un poquito más de lo normal. Solo quiero recordarte que la distancia es temporal, pero todo lo que estamos construyendo es real. No importa cuántos mapas o fronteras haya en medio, siempre estoy a una llamada de distancia. Respira hondo, sonríe un poquito y acuérdate de que falta un día menos para darnos ese abrazo.',
  },
  {
    id: 2,
    etiqueta: 'Abre cuando quieras escuchar nuestra canción 🎧',
    titulo: 'Siempre me recuerda a nosotros...',
    contenido: 'Hay canciones que simplemente tienen tu nombre grabado. Le das play al reproductor de abajo, cierra los ojos un segundo e imagínate que voy caminando a tu lado. Esta canción siempre me lleva directo a ti, sin importar en qué parte de Lima estés.',
    hasAudio: true,
    audioFile: 'assets/León Larregui - Brillas (Letra).mp3',
  },
  {
    id: 3,
    etiqueta: 'Abre cuando necesites una sonrisa en un día difícil 💭',
    titulo: 'Un recordatorio importante...',
    contenido: 'Si hoy las cosas no salieron bien o el día estuvo pesado, paso a recordarte dos cosas: la primera, que eres capaz con absolutamente todo; y la segunda, que aquí tienes a alguien que te admira un montón y que está haciendo porras por ti desde Bogotá. Mañana será un día mejor, te lo prometo. Ahora descansa y déjame sacarte aunque sea una sonrisita.',
  },
  {
    id: 4,
    etiqueta: 'Abre cuando estés contando las horas para vernos ✈️',
    titulo: 'Cada vez falta menos...',
    contenido: 'Sé que la espera se hace larga, pero piensa en esto: cada día que pasa es un día que le ganamos al calendario. La primera vez que nos veamos no va a ser como cualquier otro día; va a ser el momento en que todo este viaje valga la pena. Ve preparando la lista de lugares en Perú, porque la cuenta regresiva ya empezó.',
  },
];

const SFX = {
  click: 'assets/sfx/mixkit-mouse-click-close-1113.wav',
  paper: 'assets/sfx/paper open.mp3',
  flower: 'assets/sfx/soft bell.mp3',
  pop: 'assets/sfx/soft pop.mp3',
  magic: 'assets/sfx/magic spell.mp3',
  boing: 'assets/sfx/boing.mp3',
  success: 'assets/sfx/correct sound.mp3',
  scratch: 'assets/sfx/dj scratch.mp3',
};

let sfxMuted = false;
let audioContext;
const sfxBuffers = new Map();
const sfxFallback = new Map();

function lockPageScroll(lock) {
  document.body.classList.toggle('modal-open', lock);
}

function openDialog(dialog) {
  dialog.showModal();
  lockPageScroll(true);
}

function closeDialog(dialog) {
  dialog.close();
  lockPageScroll(false);
}

async function ensureAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state !== 'running') await audioContext.resume();
  return audioContext;
}

async function loadSfx(name) {
  if (sfxBuffers.has(name) || !SFX[name]) return sfxBuffers.get(name);
  const context = await ensureAudioContext();
  const response = await fetch(encodeURI(SFX[name]));
  const data = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(data);
  sfxBuffers.set(name, buffer);
  return buffer;
}

function primeSfx() {
  ensureAudioContext().then(() => {
    Object.keys(SFX).forEach((name) => loadSfx(name).catch(() => {}));
  }).catch(() => {});
}

['pointerdown', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, primeSfx, { once: true, passive: true });
});

function playSfx(name, volume = 0.45) {
  if (sfxMuted || !SFX[name]) return;
  ensureAudioContext()
    .then((context) => loadSfx(name).then((buffer) => {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain).connect(context.destination);
      source.start();
    }))
    .catch(() => {
      const audio = sfxFallback.get(name) ?? new Audio(encodeURI(SFX[name]));
      sfxFallback.set(name, audio);
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });
}

/* ============================================================
   ANIMACIÓN al hacer scroll
   ============================================================ */
function setupScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -12% 0px' });

  targets.forEach(target => observer.observe(target));
}

/* ============================================================
   Botones que avanzan por la historia
   ============================================================ */
function setupScrollCue() {
  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ============================================================
   RAMO INTERACTIVO: mensajes, modal y progreso
   ============================================================ */
function setupInteractiveBouquet() {
  const modal = document.getElementById('flower-modal');
  const message = document.getElementById('flower-message');
  const progress = document.getElementById('flower-progress');
  const dots = [...document.querySelectorAll('#flower-dots span')];
  const continueButton = document.getElementById('continue-story');
  const closeButton = modal?.querySelector('.flower-modal__close');
  const frame = modal?.querySelector('.flower-modal__frame');
  const hotspots = [...document.querySelectorAll('.flower-hotspot')];
  if (!modal || !message || !progress || !continueButton || !closeButton || !frame || !hotspots.length) return;

  const discovered = new Set();

  hotspots.forEach((hotspot) => {
    hotspot.addEventListener('click', () => {
      playSfx('flower', 0.35);
      const flowerIndex = Number(hotspot.dataset.flower);
      discovered.add(flowerIndex);
      hotspot.classList.add('is-discovered');
      hotspot.setAttribute('aria-label', `Volver a leer el mensaje de la flor ${flowerIndex + 1}`);
      message.textContent = flowerMessages[flowerIndex];
      frame.src = 'assets/marco1.png';
      progress.textContent = `Has descubierto ${discovered.size} de ${hotspots.length} flores 🌻`;
      dots.forEach((dot, index) => dot.classList.toggle('is-filled', index < discovered.size));
      if (discovered.size === hotspots.length) {
        document.getElementById('inicio')?.classList.add('is-bouquet-complete');
        continueButton.disabled = false;
        continueButton.textContent = 'Seguir leyendo';
        continueButton.dataset.scrollTarget = '#mensaje';
      }
      openDialog(modal);
    });
  });

  closeButton.addEventListener('click', () => closeDialog(modal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeDialog(modal);
  });
  modal.addEventListener('close', () => lockPageScroll(false));

  continueButton.addEventListener('click', () => {
    playSfx('click', 0.28);
    document.querySelector('#mensaje')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ============================================================
   MAPA BOGOTÁ - LIMA: pines y contador de distancia
   ============================================================ */
function setupRouteMap() {
  const section = document.getElementById('ruta');
  const counter = document.getElementById('route-km');
  const pins = [...document.querySelectorAll('.route__pin')];
  if (!section || !counter || !pins.length) return;

  const formatKm = (value) => `${Math.round(value).toLocaleString('es-CO')} KM`;

  pins.forEach((pin) => {
    pin.addEventListener('click', () => {
      playSfx('pop', 0.3);
      const open = pin.getAttribute('aria-expanded') === 'true';
      pins.forEach((other) => other.setAttribute('aria-expanded', 'false'));
      pin.setAttribute('aria-expanded', String(!open));
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.route__pin')) {
      pins.forEach((pin) => pin.setAttribute('aria-expanded', 'false'));
    }
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counter.textContent = formatKm(CONFIG.totalKm);
    return;
  }

  const pinObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      section.classList.add('is-in-view');
      pinObserver.disconnect();
    });
  }, { threshold: 0.25 });
  pinObserver.observe(section);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / 1400);
        counter.textContent = formatKm(CONFIG.totalKm * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.3 });

  observer.observe(section);
}

/* ============================================================
   LA PREGUNTA: botón que huye, mensajes y confirmación
   ============================================================ */
function setupQuestion() {
  const section = document.getElementById('pregunta');
  const yes = document.getElementById('question-yes');
  const no = document.getElementById('question-no');
  const toast = document.getElementById('question-toast');
  const modal = document.getElementById('question-modal');
  const next = document.getElementById('question-next');
  if (!section || !yes || !no || !toast || !modal || !next) return;

  const excuses = [
    '¡Ups! El botón se puso nervioso... 😜',
    'Esa opción no aplica para nuestro primer encuentro.',
    'El «Sí» acaba de crecer para que no falles la puntería 👀',
    'Buen intento, pero la respuesta correcta es solo una 💛',
  ];
  const MAX_ATTEMPTS = 5;

  let attempts = 0;
  let toastTimer;
  let lastFlee = 0;

  document.body.classList.add('question-locked');

  function showToast(clientX, clientY) {
    const bounds = section.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - bounds.left, 90), bounds.width - 90);
    const y = Math.min(Math.max(clientY - bounds.top, 70), bounds.height - 20);

    toast.textContent = excuses[Math.floor(Math.random() * excuses.length)];
    toast.style.left = `${x}px`;
    toast.style.top = `${y}px`;
    toast.classList.add('is-visible');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1500);
  }

  function flee(event) {
    const now = Date.now();
    if (attempts >= MAX_ATTEMPTS || now - lastFlee < 320) return;
    lastFlee = now;
    attempts += 1;
    playSfx('boing', 0.38);

    if (event.cancelable) event.preventDefault();

    const bounds = section.getBoundingClientRect();
    const button = no.getBoundingClientRect();
    const margin = 12;
    const maxX = Math.max(margin, bounds.width - button.width - margin);

    // Se mantiene dentro de la franja de la sección que está en pantalla
    const visibleTop = Math.max(margin, -bounds.top + margin);
    const visibleBottom = Math.min(
      bounds.height - button.height - margin,
      -bounds.top + window.innerHeight - button.height - margin,
    );
    const topRange = Math.max(visibleTop, visibleBottom);

    no.classList.add('is-loose');
    no.style.left = `${margin + Math.random() * (maxX - margin)}px`;
    no.style.top = `${visibleTop + Math.random() * (topRange - visibleTop)}px`;

    yes.style.setProperty('--grow', String(1 + attempts * 0.2));

    const point = event.touches?.[0] ?? event;
    showToast(
      point.clientX ?? bounds.left + bounds.width / 2,
      point.clientY ?? bounds.top + bounds.height / 2,
    );

    if (attempts >= MAX_ATTEMPTS) no.classList.add('is-gone');
  }

  no.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') flee(event);
  });
  no.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') flee(event);
  });
  no.addEventListener('click', flee);

  function keepNoButtonInView() {
    if (!no.classList.contains('is-loose') || no.classList.contains('is-gone')) return;
    const bounds = section.getBoundingClientRect();
    const button = no.getBoundingClientRect();
    const margin = 12;
    const left = Math.min(Math.max(Number.parseFloat(no.style.left) || margin, margin), bounds.width - button.width - margin);
    const top = Math.min(Math.max(Number.parseFloat(no.style.top) || margin, margin), bounds.height - button.height - margin);
    no.style.left = `${left}px`;
    no.style.top = `${top}px`;
  }

  window.addEventListener('resize', keepNoButtonInView, { passive: true });
  window.addEventListener('orientationchange', keepNoButtonInView, { passive: true });

  yes.addEventListener('click', () => {
    playSfx('success', 0.45);
    no.classList.add('is-gone');
    next.hidden = false;
    document.body.classList.remove('question-locked');
    launchPetalBurst(section);
    openDialog(modal);
  });

  modal.querySelector('.flower-modal__close')?.addEventListener('click', () => closeDialog(modal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeDialog(modal);
  });
  modal.addEventListener('close', () => lockPageScroll(false));
}

/* ============================================================
   SOBRES: cuadrícula, modal y marca de leídos
   ============================================================ */
const TURNTABLE_MARKUP = `
  <div class="turntable">
    <img class="turntable__base" src="assets/tocadiscos.png" alt="Tocadiscos">
    <span class="turntable__platter">
      <img class="turntable__disc" src="assets/disco.png" alt="" aria-hidden="true">
    </span>
    <img class="turntable__notes" src="assets/notas.png" alt="" aria-hidden="true">
    <img class="turntable__bubble" src="assets/reproduciendo.png" alt="" aria-hidden="true">
  </div>
  <button class="turntable__toggle" type="button" aria-pressed="false">
    <span class="turntable__icon" aria-hidden="true">▶</span>
    <span class="turntable__label">Reproducir</span>
  </button>
  <div class="turntable__embed"></div>
`;

function renderPlayer(container, { file }) {
  container.replaceChildren();
  container.insertAdjacentHTML('beforeend', TURNTABLE_MARKUP);

  const stage = container.querySelector('.turntable');
  const disc = container.querySelector('.turntable__disc');
  const toggle = container.querySelector('.turntable__toggle');
  const icon = container.querySelector('.turntable__icon');
  const label = container.querySelector('.turntable__label');
  const embed = container.querySelector('.turntable__embed');

  let playing = false;
  const audio = document.createElement('audio');

  function setPlaying(next) {
    playing = next;
    disc.classList.toggle('spinning', next);
    stage.classList.toggle('is-playing', next);
    toggle.setAttribute('aria-pressed', String(next));
    icon.textContent = next ? '⏸' : '▶';
    label.textContent = next ? 'Pausar' : 'Reproducir';
  }

  function showHint() {
    const hint = document.createElement('p');
    hint.className = 'turntable__hint';
    hint.textContent = 'La canción León Larregui – Brillas no cargó esta vez. Inténtalo de nuevo en un momento 💛';
    embed.replaceChildren(hint);
    toggle.disabled = true;
  }

  if (!file) {
    showHint();
    return;
  }

  audio.src = encodeURI(file);
  audio.preload = 'metadata';
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => setPlaying(false));
  audio.addEventListener('error', () => {
    setPlaying(false);
    showHint();
  });
  embed.appendChild(audio);

  toggle.addEventListener('click', () => {
    if (playing) {
      playSfx('scratch', 0.35);
      audio.pause();
    } else {
      audio.play().catch(() => showHint());
    }
  });
}

function setupLetters() {
  const grid = document.getElementById('letters-grid');
  const modal = document.getElementById('letter-modal');
  const tag = document.getElementById('letter-modal-tag');
  const title = document.getElementById('letter-modal-title');
  const text = document.getElementById('letter-modal-text');
  const audioBox = document.getElementById('letter-modal-audio');
  const closeButton = document.getElementById('letter-modal-close');
  if (!grid || !modal || !tag || !title || !text || !audioBox || !closeButton) return;

  cartas.forEach((carta) => {
    const item = document.createElement('li');
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'letter-card';
    card.dataset.id = String(carta.id);

    const art = document.createElement('img');
    art.className = 'letter-card__art';
    art.src = 'assets/SobreCerrado.png';
    art.alt = '';
    art.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'letter-card__tag';
    label.textContent = carta.etiqueta;

    const badge = document.createElement('span');
    badge.className = 'letter-card__badge';
    badge.textContent = '💛';
    badge.setAttribute('aria-hidden', 'true');

    card.append(art, label, badge);

    card.addEventListener('click', () => {
      playSfx('paper', 0.45);
      card.classList.add('is-open');
      card.setAttribute('aria-label', `${carta.etiqueta} (ya la abriste)`);

      tag.textContent = carta.etiqueta;
      title.textContent = carta.titulo;
      text.textContent = carta.contenido;

      audioBox.hidden = !carta.hasAudio;
      if (carta.hasAudio) renderPlayer(audioBox, { file: carta.audioFile });
      else audioBox.replaceChildren();

      openDialog(modal);
    });

    item.appendChild(card);
    grid.appendChild(item);
  });

  function closeModal() {
    audioBox.replaceChildren();
    closeDialog(modal);
  }

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener('close', () => audioBox.replaceChildren());
  modal.addEventListener('close', () => lockPageScroll(false));
}

/* ============================================================
   CIERRE: beso de vuelta y corazones que suben
   ============================================================ */
function setupFinal() {
  const cta = document.getElementById('final-cta');
  const hint = document.getElementById('final-hint');
  if (!cta || !hint) return;

  const INSTAGRAM_USER = 'santi2349kun';
  const KISS_MESSAGE = '¡Me encantaron mis flores amarillas del 21 de septiembre! 🌻 Te espero pronto para reclamar ese beso en persona 🇵🇪❤️';
  const PIECES = ['assets/Heart Decorations 3.png', 'assets/flower decorations 1.png', 'assets/SingleFlower Decoration.png'];

  let sky;
  let timer;
  let cleanupTimer;

  function spawnPiece() {
    const piece = document.createElement('img');
    piece.src = PIECES[Math.floor(Math.random() * PIECES.length)];
    piece.alt = '';
    piece.className = 'rising-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty('--size', `${20 + Math.random() * 26}px`);
    piece.style.setProperty('--duration', `${5 + Math.random() * 4}s`);
    piece.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
    piece.style.setProperty('--spin', `${-220 + Math.random() * 440}deg`);
    piece.addEventListener('animationend', () => piece.remove());
    sky.appendChild(piece);
  }

  function startRising() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || timer) return;

    sky = document.createElement('div');
    sky.className = 'final-sky';
    sky.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sky);

    for (let index = 0; index < 8; index += 1) spawnPiece();
    timer = window.setInterval(() => {
      if (document.hidden) return;
      spawnPiece();
      spawnPiece();
    }, 420);

    window.clearTimeout(cleanupTimer);
    cleanupTimer = window.setTimeout(() => {
      window.clearInterval(timer);
      timer = null;
      window.setTimeout(() => {
        sky?.remove();
        sky = null;
      }, 9000);
    }, 9000);
  }

  cta.addEventListener('click', () => {
    playSfx('magic', 0.42);
    startRising();

    const instagramUrl = `https://ig.me/m/${INSTAGRAM_USER}`;
    const popup = window.open(instagramUrl, '_blank', 'noopener');

    navigator.clipboard.writeText(KISS_MESSAGE).then(() => {
      hint.textContent = 'Mensaje copiado 💌 sólo pégalo en el chat.';
    }).catch(() => {
      hint.textContent = 'Te abro el chat para que me cuentes 💛';
    });

    if (!popup) {
      hint.innerHTML = `<a href="${instagramUrl}" target="_blank" rel="noopener">Abrir Instagram</a>`;
    }
  });
}

/* ============================================================
   PORTADA: pétalos, música y apertura del regalo
   ============================================================ */
function createParticle(className, index, total) {
  const particle = document.createElement('img');
  const assets = [
    'assets/flower decorations 1.png',
    'assets/SingleFlower Decoration.png',
    'assets/Heart Decorations 3.png',
  ];
  const assetIndex = index % assets.length;

  particle.src = assets[assetIndex];
  particle.alt = '';
  particle.className = `${className}${assetIndex === 2 ? ` ${className}--heart` : ''}`;
  particle.style.setProperty('--size', `${22 + Math.random() * 28}px`);
  particle.style.setProperty('--spin', `${180 + Math.random() * 540}deg`);

  if (className === 'falling-piece') {
    particle.style.left = `${(index / total) * 100 + Math.random() * 4}%`;
    particle.style.setProperty('--duration', `${9 + Math.random() * 8}s`);
    particle.style.setProperty('--delay', `${-Math.random() * 16}s`);
    particle.style.setProperty('--drift', `${-70 + Math.random() * 140}px`);
  } else {
    const angle = (Math.PI * 2 * index) / total + Math.random() * 0.25;
    const distance = 130 + Math.random() * 260;
    particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
    particle.style.setProperty('--delay', `${Math.random() * 0.16}s`);
  }

  return particle;
}

function setupFallingPetals() {
  const container = document.getElementById('falling-petals');
  if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const count = window.innerWidth < 600 ? 10 : 16;
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    fragment.appendChild(createParticle('falling-piece', index, count));
  }
  container.appendChild(fragment);
}

function launchPetalBurst(splash) {
  const burst = document.createElement('div');
  burst.className = 'petal-burst';
  burst.setAttribute('aria-hidden', 'true');
  const count = window.innerWidth < 600 ? 22 : 34;

  for (let index = 0; index < count; index += 1) {
    burst.appendChild(createParticle('burst-piece', index, count));
  }
  splash.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1600);
}

function setupSplash() {
  const splash = document.getElementById('splash');
  const openButton = document.getElementById('open-gift');
  const continueButton = document.getElementById('continue-gift');
  const soundButton = document.getElementById('sound-toggle');
  const gift = document.querySelector('.splash__gift');
  const envelope = document.querySelector('.splash__envelope');
  if (!splash || !openButton || !continueButton || !soundButton || !gift || !envelope) return;

  let opened = false;

  soundButton.addEventListener('click', () => {
    sfxMuted = !sfxMuted;
    soundButton.setAttribute('aria-pressed', String(sfxMuted));
    soundButton.setAttribute('aria-label', sfxMuted ? 'Activar efectos' : 'Silenciar efectos');
    if (!sfxMuted) playSfx('click', 0.25);
  });

  openButton.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    openButton.disabled = true;
    playSfx('paper', 0.45);
    playSfx('magic', 0.35);

    envelope.src = 'assets/SobreAbierto.png';
    envelope.alt = 'El sobre se abre y libera pétalos amarillos';
    gift.classList.add('is-open');
    launchPetalBurst(splash);

    window.setTimeout(() => continueButton.focus(), 1000);
  });

  continueButton.addEventListener('click', () => {
    playSfx('click', 0.28);
    splash.classList.add('is-leaving');
    document.body.classList.remove('splash-open');
    soundButton.classList.add('is-over-content');
    document.getElementById('inicio')?.focus({ preventScroll: true });

    window.setTimeout(() => splash.remove(), 800);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupScrollCue();
  setupInteractiveBouquet();
  setupRouteMap();
  setupQuestion();
  setupLetters();
  setupScrollReveal();
  setupFinal();
  setupFallingPetals();
  setupSplash();
});
