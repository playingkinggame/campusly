// Curved, draggable hero carousel.
// The maths is unchanged from the original inline script: cards ride a curve,
// grow towards the middle and are clipped with a rounded quad path.
//
// Cards are plain pre-rendered images (one per Campusly feature). There is no
// video in the hero any more, so there are no video decoders competing with the
// page scroll: only cheap, already-decoded pictures move.
//
// It does not own a requestAnimationFrame loop: initHeroCarousel returns an
// update(dt) function that the master loop calls.

// Ten cards = ten things Campusly does. Images live in /public/media/hero/.
// Source art + generator: scripts/hero-art/ (change the text there and re-run).
const HERO_CARDS = [
  { file: 'discover',     title: 'Find your people',  tag: 'Match % + mutual friends', icon: 'compass',  alt: 'A student profile card showing a 92% match and a Connect button' },
  { file: 'chat',         title: 'Private chat',      tag: 'Text, files, voice notes', icon: 'chat',     alt: 'A chat with text, a voice note, a photo and a reaction' },
  { file: 'teammates',    title: 'Find teammates',    tag: 'Skill tag matching',       icon: 'users',    alt: 'A hackathon teammate post asking for a frontend developer' },
  { file: 'events',       title: 'Campus events',     tag: 'See who is going',         icon: 'calendar', alt: 'An event card for Hack Night with an I am going button' },
  { file: 'study',        title: 'Study rooms',       tag: 'Share notes',              icon: 'book',     alt: 'A study room with shared PDF notes to download' },
  { file: 'lostfound',    title: 'Lost & found',      tag: 'Get it back',              icon: 'search',   alt: 'A found item post for a black water bottle' },
  { file: 'rides',        title: 'Ride sharing',      tag: 'Split the fare',           icon: 'car',      alt: 'A ride from VIT Chennai to the airport with 3 seats left' },
  { file: 'confessions',  title: 'Confessions',       tag: 'Anonymous, moderated',     icon: 'eyeoff',   alt: 'Anonymous confessions that are reviewed before they go live' },
  { file: 'seniors',      title: 'Senior connect',    tag: 'Ask a 4th year',           icon: 'cap',      alt: 'A junior asks about placements and a senior answers' },
  { file: 'achievements', title: 'Achievements',      tag: 'Show your wins',           icon: 'trophy',   alt: 'A hackathon finalist certificate with badges and a streak' },
];

// Tiny stroke icons (Lucide shapes) for the round badge on each card.
const ICON_PATHS = {
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  eyeoff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
  cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
};

function iconSvg(name) {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

export function initHeroCarousel() {
  const carouselWrap = document.getElementById('heroCarousel');
  if (!carouselWrap) return null;
  // Card 0 is already real HTML: it carries the LCP image, so reuse it.
  const firstCard = carouselWrap.querySelector('.hero-card');

  const numCards = HERO_CARDS.length;
  const cards = [];

  for (let i = 0; i < numCards; i++) {
    const card = i === 0 && firstCard ? firstCard : document.createElement('div');
    card.className = 'hero-card';
    const info = HERO_CARDS[i];

    if (card !== firstCard) {
      card.innerHTML = `
      <div class="hero-card-media">
        <img class="hero-card-img" src="/media/hero/${info.file}.webp" alt="${info.alt}" width="720" height="1200" decoding="async" fetchpriority="low" draggable="false" />
        <div class="hero-card-overlay"></div>
        <div class="hero-card-play">${iconSvg(info.icon)}</div>
        <div class="hero-card-chip">
          <div class="hero-chip-avatar">${info.title.charAt(0)}</div>
          <div class="hero-chip-info">
            <span class="hero-chip-name">${info.title}</span>
            <span class="hero-chip-meta">${info.tag}</span>
          </div>
        </div>
      </div>
    `;
      carouselWrap.appendChild(card);
    }
    cards.push({ el: card, index: i, focus: false });
  }

  // Responsive scale: one source of truth for CSS (--u) and the JS carousel maths.
  const heroSec = document.getElementById('hero');
  const MOBILE_BP = 820;
  let U = 1;        // px per design unit
  let CX = 720;     // carousel centre-x in px, relative to the carousel box
  let YOFF = 470;   // design-space y of the carousel box top
  let needsRender = true;

  function layoutMetrics() {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    if (vw <= MOBILE_BP) {
      heroSec.style.removeProperty('--u');
      U = Math.max(0.55, Math.min(vw / 560, 0.95));
      YOFF = 487;
      carouselWrap.style.setProperty('--u', U + 'px');
    } else {
      U = Math.min(vw / 1440, vh / 1080);
      YOFF = 470;
      heroSec.style.setProperty('--u', U + 'px');
      carouselWrap.style.removeProperty('--u');
    }
    CX = carouselWrap.clientWidth / 2;
    needsRender = true;
  }
  layoutMetrics();
  window.addEventListener('resize', layoutMetrics);

  // The carousel only animates while the hero is on screen, and it pauses while
  // the page itself is scrolling so the two never compete for the same frame.
  let heroVisible = true;
  let pageScrolling = false;
  let scrollEndTimer = 0;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) needsRender = true;
    }, { threshold: 0 }).observe(heroSec);
  }

  window.addEventListener('scroll', () => {
    if (!pageScrolling) {
      pageScrolling = true;
      needsRender = true;
    }
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(() => {
      pageScrolling = false;
      needsRender = true;
    }, 140);
  }, { passive: true });

  // Carousel physics & motion. All timing is seconds, supplied by the loop.
  let scrollOffset = 0;
  let isDragging = false;
  let lastX = 0;
  let velocity = 0;
  let autoScroll = false; // gentle drift starts after the first real interaction
  const baseSpeed = 60; // design units per second (60 = one unit per frame at 60fps)

  function enableAutoScroll() {
    if (autoScroll) return;
    autoScroll = true;
    needsRender = true;
  }

  // Keeping the carousel still until the visitor interacts keeps the hero
  // poster static for LCP and avoids per-frame layout work on an idle page.
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((type) => {
    window.addEventListener(type, enableAutoScroll, { once: true, passive: true });
  });
  window.addEventListener('scroll', enableAutoScroll, { once: true, passive: true });

  function updateCarousel(dt) {
    const u = U;
    const totalWidth = numCards * 196;
    const moving = isDragging || autoScroll;
    if (!moving && !needsRender) return;

    if (!isDragging && autoScroll) {
      velocity *= Math.pow(0.05, dt); // decays 95% per second
      if (Math.abs(velocity) < 0.1) velocity = 0;
      scrollOffset += (baseSpeed + velocity) * dt;
    }

    cards.forEach((c) => {
      let unpushedOffset = ((c.index * 196 - scrollOffset) % totalWidth + totalWidth) % totalWidth;
      if (unpushedOffset > totalWidth / 2) unpushedOffset -= totalWidth;

      const t = unpushedOffset;
      const x = 720 + t * (1 + 0.083 * Math.pow(t / 706, 2));
      const d = Math.abs(x - 720) / 706;

      const cardW = 170 + 48 * Math.pow(d, 2);
      const yCenter = 687 - 12 * Math.pow(d, 2);

      const qLeft = Math.abs((x - cardW / 2) - 720) / 706;
      const qRight = Math.abs((x + cardW / 2) - 720) / 706;
      const hLeft = 280 + 92 * Math.pow(qLeft, 2.6);
      const hRight = 280 + 92 * Math.pow(qRight, 2.6);
      const maxH = Math.max(hLeft, hRight);

      const wPx = cardW * u;
      const maxHPx = maxH * u;
      const xPx = CX + (x - 720 - cardW / 2) * u;
      const yPx = (yCenter - YOFF - maxH / 2) * u;

      c.el.style.width = `${wPx}px`;
      c.el.style.height = `${maxHPx}px`;
      c.el.style.transform = `translate3d(${xPx}px, ${yPx}px, 0)`;

      // Rounded quad clip path.
      const cornerR = 15 * u;
      const topL = (maxH - hLeft) / 2 * u;
      const botL = topL + hLeft * u;
      const topR = (maxH - hRight) / 2 * u;
      const botR = topR + hRight * u;

      c.el.style.clipPath = `path('M 0 ${topL + cornerR} Q 0 ${topL} ${cornerR} ${topL} L ${wPx - cornerR} ${topR} Q ${wPx} ${topR} ${wPx} ${topR + cornerR} L ${wPx} ${botR - cornerR} Q ${wPx} ${botR} ${wPx - cornerR} ${botR} L ${cornerR} ${botL} Q 0 ${botL} 0 ${botL - cornerR} Z')`;

      // Only the two or three centre cards keep real glass blur. Ten blurred
      // chips sliding every frame is one of the most expensive things on the page.
      const focus = d < 0.24;
      if (focus !== c.focus) {
        c.focus = focus;
        c.el.classList.toggle('is-focus', focus);
      }
    });
    needsRender = false;
  }

  // Strong desktops (8+ logical cores and a mouse) animate the idle drift at the
  // full display rate, which is the smoothest. Everything else uses 30fps, which
  // halves the card layout/clip-path work at this slow speed. Drags always run at
  // the display refresh.
  const fullRate = (navigator.hardwareConcurrency || 4) >= 8
    && window.matchMedia('(pointer: fine)').matches;
  let renderClock = 0;
  function update(dt) {
    if (!heroVisible || pageScrolling) return;
    if (isDragging || fullRate) {
      renderClock = 0;
      updateCarousel(Math.min(dt, 0.064));
      return;
    }
    renderClock += dt;
    if (renderClock < 1 / 30) return;
    const step = Math.min(renderClock, 0.064);
    renderClock = 0;
    updateCarousel(step);
  }

  // Pointer events for drag.
  carouselWrap.addEventListener('pointerdown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    velocity = 0;
    carouselWrap.classList.add('grabbing');
    carouselWrap.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - lastX) / U;
    scrollOffset -= dx;
    velocity = -dx * 30;
    lastX = e.clientX;
  });

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    carouselWrap.classList.remove('grabbing');
    try { carouselWrap.releasePointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  return { update };
}
