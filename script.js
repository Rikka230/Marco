(() => {
  const app = document.querySelector('#app');
  if (!app) return;

  const order = ['home', 'music', 'parcours', 'gallery', 'filmographie', 'composition', 'scores', 'booking'];
  const pageAccents = {
    home: '#86f5a8',
    music: '#f4bd68',
    parcours: '#73aaf6',
    gallery: '#f08ac8',
    filmographie: '#f4bd68',
    composition: '#ff355d',
    scores: '#ff355d',
    booking: '#d8c3ff'
  };
  let currentPage = app.querySelector('.page')?.dataset.page || 'home';
  let busy = false;

  const band = document.createElement('div');
  band.className = 'transition-band';
  band.setAttribute('aria-hidden', 'true');
  band.innerHTML = '<span></span>';
  document.body.appendChild(band);

  const Routes = [
    { id: 'home', href: '/index.html', accent: '#86f5a8' },
    { id: 'music', href: '/music.html', accent: '#f4bd68' },
    { id: 'parcours', href: '/parcours.html', accent: '#73aaf6' },
    { id: 'gallery', href: '/gallery.html', accent: '#f08ac8' },
    { id: 'filmographie', href: '/filmographie.html', accent: '#f4bd68' },
    { id: 'composition', href: '/composition.html', accent: '#ff355d' },
    { id: 'scores', href: '/projects.html', accent: '#ff355d' },
    { id: 'booking', href: '/contact.html', accent: '#d8c3ff' }
  ];

  function routeFromPath(path) {
    const file = (path.split('/').pop() || 'index.html').toLowerCase();
    const by = (id) => Routes.find((r) => r.id === id);
    if (file.includes('music') || file.includes('violon')) return by('music');
    if (file.includes('composition')) return by('composition');
    if (file.includes('parcours')) return by('parcours');
    if (file.includes('filmographie')) return by('filmographie');
    if (file.includes('projects')) return by('scores');
    if (file.includes('gallery') || file.includes('modele')) return by('gallery');
    if (file.includes('contact')) return by('booking');
    return by('home');
  }

  const pageFromPath = (path) => routeFromPath(path).id;

  // === Seam de cycle de vie des pages (PageTransition) — voir plan Phase 0 ===
  // En commit 4 il est DORMANT : aucun module ne s'enregistre encore, donc enter/cleanup ne font rien.
  const Marco = (window.Marco = window.Marco || {});
  Marco.pages = Marco.pages || {};
  Marco.routes = Routes;
  const lifecycle = new EventTarget();
  Marco.lifecycle = lifecycle;
  const emit = (type, detail) => lifecycle.dispatchEvent(new CustomEvent(type, { detail }));
  const pageControllers = new WeakMap();
  const enteredPages = new WeakSet();

  Marco.activatePage = function (pageEl, pageId, opts = {}) {
    if (!pageEl || enteredPages.has(pageEl)) return;
    emit('render', { pageEl, pageId });
    const reg = Marco.pages[pageId];
    if (reg && typeof reg.enter === 'function') {
      let controller = pageControllers.get(pageEl);
      if (!controller) { controller = new AbortController(); pageControllers.set(pageEl, controller); }
      enteredPages.add(pageEl);
      try { reg.enter(pageEl, { signal: controller.signal, pageId, isHardLoad: !!opts.isHardLoad }); }
      catch (e) { console.error('[Marco] enter', pageId, e); }
    }
    emit('ready', { pageEl, pageId });
  };

  Marco.deactivatePage = function (pageEl, pageId) {
    if (!pageEl) return;
    emit('leave', { pageEl, pageId });
    const reg = Marco.pages[pageId];
    const controller = pageControllers.get(pageEl);
    if (reg && typeof reg.cleanup === 'function') {
      try { reg.cleanup(pageEl, { signal: controller && controller.signal, pageId }); }
      catch (e) { console.error('[Marco] cleanup', pageId, e); }
    }
    if (controller) controller.abort();
    pageControllers.delete(pageEl);
    enteredPages.delete(pageEl);
  };

  Marco.registerPage = function (pageId, handlers) {
    Marco.pages[pageId] = handlers;
    // Rattrapage hard-load : le module est chargé APRÈS le CORE ; si son .page est déjà actif, on l'entre.
    const el = app.querySelector('.page:not(.is-leaving)');
    if (el && (el.dataset.page === pageId || routeFromPath(window.location.pathname).id === pageId)) {
      Marco.activatePage(el, pageId, { isHardLoad: true });
    }
  };

  const transitionLabel = (page, fallback) => (
    page?.dataset.transitionLabel ||
    page?.querySelector('.mega.first')?.textContent?.trim() ||
    fallback.toUpperCase()
  );

  function syncPageShell(pageId = currentPage) {
    const active = pageId === 'scores' ? 'composition' : pageId;
    const accent = pageAccents[pageId] || pageAccents[active] || pageAccents.home;

    document.body.dataset.marcoPage = active;
    document.documentElement.style.setProperty('--marco-nav-accent', accent);

    const nav = document.querySelector('[data-chapter-nav]');
    if (nav) {
      nav.dataset.activePage = active;
      nav.style.setProperty('--marco-nav-accent', accent);
    }
  }

  const assetKey = (value, base = window.location.href) => {
    try {
      const url = new URL(value, base);
      return `${url.origin}${url.pathname}`;
    } catch (error) {
      return String(value || '');
    }
  };

  function hasAsset(selector, attr, value, base = window.location.href) {
    const key = assetKey(value, base);
    return [...document.querySelectorAll(selector)].some((asset) => assetKey(asset.getAttribute(attr) || asset[attr] || '') === key);
  }

  function loadStylesFrom(doc, baseUrl, ownerPage) {
    const links = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')];
    const hrefs = links.map((source) => new URL(source.getAttribute('href'), baseUrl).href);

    return Promise.all(links.map((source) => new Promise((resolve) => {
      const href = new URL(source.getAttribute('href'), baseUrl).href;
      if (hasAsset('link[rel~="stylesheet"][href]', 'href', href)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      if (source.media) link.media = source.media;
      link.dataset.pjaxAsset = 'true';
      if (ownerPage) link.dataset.ownerPage = ownerPage;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', resolve, { once: true });
      document.head.appendChild(link);
    }))).then(() => new Set(hrefs));
  }

  // Retire les CSS PJAX appartenant à la page sortante et non requis par la page entrante.
  // Ne touche jamais aux CSS de base (chargés via le HTML, donc sans data-pjax-asset).
  function cleanupStyles(leavingPageId, keepHrefs) {
    if (!leavingPageId) return;
    document.querySelectorAll('link[data-pjax-asset][data-owner-page]').forEach((link) => {
      if (link.dataset.ownerPage === leavingPageId && !(keepHrefs && keepHrefs.has(link.href))) {
        link.remove();
      }
    });
  }

  async function loadScriptsFrom(doc, baseUrl) {
    const scripts = [...doc.querySelectorAll('script[src]')];

    for (const source of scripts) {
      const src = new URL(source.getAttribute('src'), baseUrl).href;
      const path = new URL(src).pathname;
      if (path.endsWith('/script.js') || hasAsset('script[src]', 'src', src)) continue;

      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        if (source.type) script.type = source.type;
        script.dataset.pjaxAsset = 'true';
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', resolve, { once: true });
        document.body.appendChild(script);
      });
    }
  }

  function runBand(label, page) {
    const accent = getComputedStyle(page).getPropertyValue('--accent').trim() || '#86f8a7';
    band.style.setProperty('--band-accent', accent);
    band.querySelector('span').textContent = label;
    band.classList.remove('is-active');
    void band.offsetWidth;
    band.classList.add('is-active');
  }

  // Attend la fin réelle des animations de l'élément (au lieu d'un délai codé en dur),
  // avec un repli temporisé si getAnimations est absent / l'élément est retiré / onglet en arrière-plan.
  function waitForAnimations(el, fallbackMs = 1100) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => { if (settled) return; settled = true; resolve(); };
      const fallback = window.setTimeout(finish, fallbackMs);
      if (!el || typeof el.getAnimations !== 'function') return;
      let anims;
      try { anims = el.getAnimations({ subtree: true }); } catch (e) { anims = el.getAnimations(); }
      if (!anims || !anims.length) { window.clearTimeout(fallback); finish(); return; }
      Promise.allSettled(anims.map((a) => a.finished)).then(() => {
        window.clearTimeout(fallback);
        finish();
      });
    });
  }

  let inflight = null;

  async function goTo(url, push = true) {
    if (busy) return;
    const absolute = new URL(url, window.location.href);
    if (absolute.href === window.location.href && app.querySelector('.page')) return;

    busy = true;
    document.body.classList.add('is-transitioning');
    emit('before-load', { from: currentPage, to: pageFromPath(absolute.pathname), url: absolute.href });

    if (inflight) inflight.abort();
    inflight = new AbortController();
    const controller = inflight;
    const timer = window.setTimeout(() => controller.abort(), 8000);
    let appended = false;

    try {
      const res = await fetch(absolute.pathname, { headers: { 'X-PJAX': 'true' }, signal: controller.signal });
      window.clearTimeout(timer);
      if (!res.ok) throw new Error(`PJAX ${res.status} sur ${absolute.pathname}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const next = doc.querySelector('#app .page');
      if (!next) throw new Error('Page PJAX introuvable');
      const nextPage = pageFromPath(absolute.pathname);
      const enteringHrefs = await loadStylesFrom(doc, absolute.href, nextPage);

      const fromIndex = order.indexOf(currentPage);
      const toIndex = order.indexOf(nextPage);
      const forward = toIndex >= fromIndex;
      const current = app.querySelector('.page');

      next.classList.add(forward ? 'slide-from-right' : 'slide-from-left');
      app.appendChild(next);
      appended = true;
      await loadScriptsFrom(doc, absolute.href);
      runBand(transitionLabel(next, nextPage), next);
      Marco.activatePage(next, nextPage, { isHardLoad: false });

      if (current) {
        current.classList.add(forward ? 'slide-out-left' : 'slide-out-right', 'is-leaving');
      }

      await Promise.all([
        waitForAnimations(next),
        current ? waitForAnimations(current) : Promise.resolve()
      ]);

      const leavingPageId = currentPage;
      if (current) Marco.deactivatePage(current, leavingPageId);
      [...app.querySelectorAll('.page.is-leaving')].forEach((el) => el.remove());
      next.classList.remove('slide-from-right', 'slide-from-left');
      currentPage = next.dataset.page || nextPage;
      cleanupStyles(leavingPageId, enteringHrefs);
      syncPageShell(currentPage);
      if (push) history.pushState({ page: currentPage }, '', absolute.pathname);
      document.title = doc.title || document.title;
      document.body.classList.remove('is-transitioning');
      busy = false;
      inflight = null;
    } catch (err) {
      window.clearTimeout(timer);
      // Une navigation plus récente ou un timeout a annulé ce fetch.
      if (err && err.name === 'AbortError') {
        if (!appended) {
          busy = false;
          document.body.classList.remove('is-transitioning');
          window.location.href = absolute.href;
        }
        return;
      }
      console.error(err);
      busy = false;
      document.body.classList.remove('is-transitioning');
      inflight = null;
      // Échec avant insertion : repli sur un chargement complet (jamais une page figée).
      if (!appended) window.location.href = absolute.href;
    }
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-pjax]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    goTo(url.href);
  });

  window.addEventListener('popstate', () => goTo(window.location.href, false));
  syncPageShell(currentPage);
  const initialPage = app.querySelector('.page');
  if (initialPage) Marco.activatePage(initialPage, initialPage.dataset.page || currentPage, { isHardLoad: true });
  window.setTimeout(() => syncPageShell(currentPage), 120);

  const audio = document.querySelector('#audioLoop');
  const play = document.querySelector('#playBtn');
  let playing = false;

  function syncPlayerButton() {
    if (!play || !audio) return;
    playing = !audio.paused;
    play.textContent = playing ? 'PAUSE' : 'PLAY';
    play.classList.toggle('is-playing', playing);
    play.setAttribute('aria-label', playing ? 'Mettre la boucle audio en pause' : 'Lancer la boucle audio');
  }

  if (play && audio) {
    play.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
        syncPlayerButton();
      } catch (e) {
        console.warn('Audio bloque par le navigateur', e);
      }
    });

    audio.addEventListener('play', syncPlayerButton);
    audio.addEventListener('pause', syncPlayerButton);
    audio.addEventListener('ended', syncPlayerButton);
    syncPlayerButton();
  }

  const canvas = document.querySelector('#dotWave');
  const ctx = canvas?.getContext('2d');
  let waveFrame = null;
  let lastWave = 0;
  let t = 0;

  function parseColor(color) {
    const rgb = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
    if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };

    const hex = color.replace('#', '').trim();
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    return { r: 134, g: 248, b: 167 };
  }

  function activePage() {
    return app.querySelector('.page:not(.is-leaving)') || app.querySelector('.page');
  }

  function activeAccent() {
    const page = activePage();
    const color = page ? getComputedStyle(page).getPropertyValue('--accent').trim() : '';
    return parseColor(color || 'rgb(134, 248, 167)');
  }

  const rgba = (rgb, alpha) => `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;

  function resize() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function peak(x, center, width, amp) {
    return Math.exp(-Math.pow((x - center) / width, 2)) * amp;
  }

  function startWave() {
    if (waveFrame !== null || !canvas || !ctx) return;
    waveFrame = requestAnimationFrame(draw);
  }

  function draw(now = 0) {
    if (!canvas || !ctx) return;
    waveFrame = null;

    const w = window.innerWidth;
    const h = canvas.offsetHeight;
    const page = activePage();
    const pageName = page?.dataset.page || currentPage;
    const accent = activeAccent();
    const transitioning = document.body.classList.contains('is-transitioning');
    const frameInterval = playing ? 16 : transitioning ? 50 : 33;
    if (lastWave && now - lastWave < frameInterval) {
      startWave();
      return;
    }
    lastWave = now;

    const energyMode = playing ? 1 : 0.42;
    const pageLift = pageName === 'music' ? 1.16 : pageName === 'parcours' ? 0.96 : pageName === 'filmographie' ? 1.02 : pageName === 'composition' ? 1.08 : pageName === 'scores' ? 0.88 : pageName === 'gallery' ? 1.02 : 0.96;

    ctx.clearRect(0, 0, w, h);
    const spacingX = transitioning ? Math.max(12, Math.min(18, w / 118)) : Math.max(8, Math.min(13, w / 168));
    const spacingY = 6.2;
    const radius = Math.max(1.05, Math.min(1.75, w / 1080));
    const base = h - 17;
    t += playing ? 0.017 : 0.0065;

    for (let x = -20, i = 0; x < w + 20; x += spacingX, i++) {
      const motion = Math.sin(i * 0.31 + t * 3.0) * 0.5 + 0.5;
      const jitter = Math.sin(i * 0.71 + t * 4.8) * 0.5 + 0.5;
      const energy = energyMode * pageLift * (
        peak(x, w * 0.055, w * 0.026, 3.8 + 0.9 * Math.sin(t * 2.0)) +
        peak(x, w * 0.205, w * 0.018, 1.7 + 0.5 * Math.cos(t * 2.9)) +
        peak(x, w * 0.318, w * 0.040, 2.6 + 0.7 * Math.cos(t * 1.6)) +
        peak(x, w * 0.405, w * 0.024, 3.5 + 0.7 * Math.sin(t * 2.7)) +
        peak(x, w * 0.718, w * 0.032, 2.4 + 0.6 * Math.cos(t * 2.2)) +
        peak(x, w * 0.848, w * 0.030, 3.1 + 0.7 * Math.sin(t * 2.1))
      );

      let count = Math.max(1, Math.round(1 + energy + motion * 0.35));
      if (jitter > 0.92) count += 1;
      count = Math.min(count, transitioning ? 4 : playing ? 8 : 6);

      for (let j = 0; j < count; j++) {
        const alpha = Math.max(0.11, (playing ? 0.6 : 0.43) - j * 0.052);
        const y = base - j * spacingY;
        ctx.beginPath();
        ctx.fillStyle = rgba(accent, alpha);
        ctx.shadowColor = rgba(accent, 0.5);
        ctx.shadowBlur = transitioning ? 0 : j === 0 ? 3.5 : 5;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = transitioning ? 0 : 3.5;
    for (let x = -20; x < w + 20; x += spacingX) {
      ctx.beginPath();
      ctx.fillStyle = rgba(accent, 0.22);
      ctx.arc(x, base + 5, radius * 0.68, 0, Math.PI * 2);
      ctx.fill();
    }

    startWave();
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  startWave();

  const parallax = {
    x: 0,
    y: 0,
    frame: null
  };

  function applyParallax() {
    parallax.frame = null;
    if (document.body.classList.contains('is-transitioning')) return;
    const page = activePage();
    if (!page) return;

    const title = page.querySelector('.title-wrap');
    const person = page.querySelector('.hero-person');
    const bg = page.querySelector('.photo-bg');
    const x = parallax.x;
    const y = parallax.y;
    const isHome = page.dataset.page === 'home';

    if (title) {
      title.style.setProperty('--title-x', `${x * (isHome ? -11 : -10)}px`);
      title.style.setProperty('--title-y', `${y * (isHome ? 5 : 4)}px`);
    }
    if (person) {
      person.style.setProperty('--person-x', `${x * (isHome ? 8 : 7)}px`);
      person.style.setProperty('--person-y', `${y * (isHome ? 3 : 2.5)}px`);
    }
    if (bg) {
      bg.style.setProperty('--bg-x', `${x * (isHome ? -5 : -3)}px`);
      bg.style.setProperty('--bg-y', `${y * (isHome ? -2 : -1.5)}px`);
    }
  }

  function scheduleParallax(x = 0, y = 0) {
    parallax.x = x;
    parallax.y = y;
    if (parallax.frame !== null || document.body.classList.contains('is-transitioning')) return;
    parallax.frame = requestAnimationFrame(applyParallax);
  }

  window.addEventListener('pointermove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    scheduleParallax(x, y);
  }, { passive: true });

  window.addEventListener('pointerleave', () => scheduleParallax(), { passive: true });

  document.addEventListener('click', (e) => {
    const trackButton = e.target.closest('.composition-track .track-play');
    if (!trackButton) return;

    const track = trackButton.closest('.composition-track');
    const page = trackButton.closest('.composition-page');
    const label = document.querySelector('.track-label');
    const title = track?.dataset.trackTitle || track?.querySelector('.track-title')?.textContent?.trim() || 'COMPOSITION';

    page?.querySelectorAll('.composition-track.is-active').forEach((item) => item.classList.remove('is-active'));
    track?.classList.add('is-active');

    if (label) {
      label.innerHTML = `<b>COMPOSITION</b><b>${title}</b><b>READY</b>`;
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-contact-form]');
    if (!form) return;
    e.preventDefault();

    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('.contact-submit');
    form.classList.add('is-ready');
    if (status) status.textContent = 'MESSAGE READY - CONNECT BACKEND';
    if (submit) {
      submit.textContent = 'REQUEST READY';
      window.setTimeout(() => {
        if (submit.isConnected) submit.textContent = 'SEND REQUEST';
      }, 1800);
    }
  });

  document.addEventListener('input', (e) => {
    const form = e.target.closest('[data-contact-form]');
    if (!form || !form.classList.contains('is-ready')) return;
    form.classList.remove('is-ready');
    const status = form.querySelector('[data-form-status]');
    if (status) status.textContent = '';
  });

  document.addEventListener('change', (e) => {
    const form = e.target.closest('[data-contact-form]');
    if (!form || !form.classList.contains('is-ready')) return;
    form.classList.remove('is-ready');
    const status = form.querySelector('[data-form-status]');
    if (status) status.textContent = '';
  });
})();

/* === MARCO GLOBAL CHAPTER NAV - START === */
(() => {
  const chapters = [
    { id: 'home', short: 'HOME', label: 'HOME', href: '/index.html' },
    { id: 'music', short: 'VIOLON', label: 'VIOLON', href: '/music.html' },
    { id: 'parcours', short: 'PARCOURS', label: 'PARCOURS', href: '/parcours.html' },
    { id: 'gallery', short: 'MODELE', label: 'MODELE', href: '/gallery.html' },
    { id: 'filmographie', short: 'FILMO', label: 'FILMOGRAPHIE', href: '/filmographie.html' },
    { id: 'composition', short: 'COMPO', label: 'COMPOSITION', href: '/composition.html' },
    { id: 'booking', short: 'CONTACT', label: 'CONTACT', href: '/contact.html' }
  ];

  function detectChapterId() {
    const page = document.querySelector('#app .page');
    const dataPage = page?.dataset?.page;
    const path = window.location.pathname.toLowerCase();

    if (dataPage === 'home' || path.endsWith('/') || path.includes('index')) return 'home';
    if (dataPage === 'composition' || path.includes('composition')) return 'composition';
    if (dataPage === 'parcours' || path.includes('parcours')) return 'parcours';
    if (dataPage === 'filmographie' || path.includes('filmographie')) return 'filmographie';
    if (dataPage === 'music' || path.includes('music') || path.includes('violon')) return 'music';
    if (dataPage === 'gallery' || path.includes('gallery') || path.includes('modele')) return 'gallery';
    if (dataPage === 'booking' || path.includes('contact')) return 'booking';
    if (dataPage === 'scores' || path.includes('projects')) return 'composition';

    return 'home';
  }

  function buildChapterNav() {
    const nav = document.createElement('nav');
    nav.className = 'chapter-nav';
    nav.setAttribute('data-chapter-nav', '');
    nav.setAttribute('aria-label', 'Navigation globale du site');

    const prev = document.createElement('button');
    prev.className = 'chapter-step chapter-step-prev';
    prev.type = 'button';
    prev.dataset.chapterStep = 'prev';
    prev.setAttribute('aria-label', 'Page précédente');
    prev.innerHTML = '<span>▲</span>';

    const toggle = document.createElement('button');
    toggle.className = 'chapter-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `
      <span class="chapter-num">01</span>
      <span class="chapter-current">HOME</span>
      <span class="chapter-dots" aria-hidden="true">${chapters.map(() => '<i></i>').join('')}</span>
      <span class="chapter-index-label">INDEX</span>
    `;

    const next = document.createElement('button');
    next.className = 'chapter-step chapter-step-next';
    next.type = 'button';
    next.dataset.chapterStep = 'next';
    next.setAttribute('aria-label', 'Page suivante');
    next.innerHTML = '<span>▼</span>';

    const panel = document.createElement('div');
    panel.className = 'chapter-panel';

    chapters.forEach((chapter, index) => {
      const link = document.createElement('a');
      link.className = 'chapter-link';
      link.href = chapter.href;
      link.setAttribute('data-pjax', '');
      link.style.setProperty('--step', String(index));
      link.dataset.chapterId = chapter.id;
      link.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${chapter.label}</strong>`;
      panel.appendChild(link);
    });

    nav.append(prev, toggle, next, panel);
    return nav;
  }

  function updateChapterNav() {
    const nav = document.querySelector('[data-chapter-nav]');
    if (!nav) return;

    const activeId = detectChapterId();
    const activeIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === activeId));
    const active = chapters[activeIndex] || chapters[0];

    nav.querySelector('.chapter-num').textContent = String(activeIndex + 1).padStart(2, '0');
    nav.querySelector('.chapter-current').textContent = active.short;

    nav.querySelectorAll('.chapter-dots i').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
    });

    nav.querySelectorAll('.chapter-link').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.chapterId === active.id);
      if (link.dataset.chapterId === active.id) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function closeChapterNav() {
    const nav = document.querySelector('[data-chapter-nav]');
    if (!nav) return;
    nav.classList.remove('is-open');
    nav.querySelector('.chapter-toggle')?.setAttribute('aria-expanded', 'false');
  }

  function goRelativeChapter(offset) {
    const activeId = detectChapterId();
    const currentIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === activeId));
    const nextIndex = (currentIndex + offset + chapters.length) % chapters.length;
    const target = chapters[nextIndex];
    const link = document.querySelector(`[data-chapter-nav] .chapter-link[data-chapter-id="${target.id}"]`);

    closeChapterNav();

    if (link) {
      link.click();
      return;
    }

    window.location.href = target.href;
  }

  function ensureChapterNav() {
    const shell = document.querySelector('.shell');
    if (!shell) return;

    let nav = document.querySelector('[data-chapter-nav]');
    if (!nav) {
      nav = buildChapterNav();
      shell.appendChild(nav);

      nav.querySelector('.chapter-toggle').addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = nav.classList.toggle('is-open');
        nav.querySelector('.chapter-toggle')?.setAttribute('aria-expanded', String(isOpen));
      });

      nav.querySelector('[data-chapter-step="prev"]')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        goRelativeChapter(-1);
      });

      nav.querySelector('[data-chapter-step="next"]')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        goRelativeChapter(1);
      });

      nav.querySelectorAll('.chapter-link').forEach((link) => {
        link.addEventListener('click', () => {
          closeChapterNav();
        });
      });
    }

    updateChapterNav();
  }

  document.addEventListener('click', (event) => {
    const nav = document.querySelector('[data-chapter-nav]');
    if (!nav || nav.contains(event.target)) return;
    closeChapterNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeChapterNav();
  });

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => {
      ensureChapterNav();
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    ensureChapterNav();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
  });

  if (document.readyState !== 'loading') {
    ensureChapterNav();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
})();
/* === MARCO GLOBAL CHAPTER NAV - END === */

/* === MARCO PATCH V0.1.0 STABILISATION - START === */
// Version: MARCO PATCH v0.1.0 — Stabilisation Composition + player global
(() => {
  const STORAGE_KEY = 'marco.activeTrack.v010';
  const TRACKS = [
    { id: '01', title: 'Cinematic Strings', meta: 'Score · Featured', audio: '/assets/audio/marco-placeholder-01.wav' },
    { id: '02', title: 'Night Motif', meta: 'Demo · Piano / Strings', audio: '/assets/audio/marco-placeholder-02.wav' },
    { id: '03', title: 'Excursion Theme', meta: 'Campaign · Visual', audio: '/assets/audio/marco-placeholder-03.wav' },
    { id: '04', title: 'Bow Texture', meta: 'Violin + Score · Atmosphere', audio: '/assets/audio/marco-placeholder-04.wav' },
    { id: '05', title: 'Red Cut', meta: 'Original · Pulse', audio: '/assets/audio/marco-placeholder-05.wav' },
    { id: '06', title: 'Stage Lines', meta: 'Stage · Scene', audio: '/assets/audio/marco-placeholder-06.wav' },
    { id: '07', title: 'Glass Motif', meta: 'Placeholder · Texture', audio: '/assets/audio/marco-placeholder-07.wav' },
    { id: '08', title: 'Low Room', meta: 'Placeholder · Ambient', audio: '/assets/audio/marco-placeholder-08.wav' },
    { id: '09', title: 'First Cut', meta: 'Placeholder · Draft', audio: '/assets/audio/marco-placeholder-09.wav' },
    { id: '10', title: 'End Theme', meta: 'Placeholder · Finale', audio: '/assets/audio/marco-placeholder-10.wav' }
  ];

  function getAudio() {
    return document.querySelector('#audioLoop');
  }

  function getPlayButton() {
    return document.querySelector('#playBtn');
  }

  function getTrackById(id) {
    return TRACKS.find((track) => track.id === String(id).padStart(2, '0')) || TRACKS[0];
  }

  function getTrackFromCompositionCard(card) {
    const index = card?.querySelector('.track-index')?.textContent?.trim();
    if (index) return getTrackById(index);

    const title = card?.dataset?.trackTitle || card?.querySelector('.track-title')?.textContent?.trim();
    return TRACKS.find((track) => track.title.toLowerCase() === String(title || '').toLowerCase()) || TRACKS[0];
  }

  function removeFailedMusicPanels() {
    document.querySelectorAll('.music-bottom-sheet, .music-taskbar-panel, .music-library-panel, .music-panel, .track-open-trigger').forEach((node) => {
      node.remove();
    });
  }

  function updateMiniLabel(track) {
    const label = document.querySelector('.track-label');
    if (!label || !track) return;
    label.innerHTML = `<b>${track.id}</b><b>${track.title}</b><b>${track.meta}</b>`;
  }

  function updateActiveStates(track) {
    document.querySelectorAll('.composition-track').forEach((card) => {
      card.classList.toggle('is-active', getTrackFromCompositionCard(card).id === track.id);
    });
  }

  function syncButton() {
    const audio = getAudio();
    const button = getPlayButton();
    if (!audio || !button) return;

    const isPlaying = !audio.paused;
    button.textContent = isPlaying ? 'PAUSE' : 'PLAY';
    button.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-label', isPlaying ? 'Mettre la musique en pause' : 'Lancer la musique');
  }

  function restoreTrack() {
    removeFailedMusicPanels();

    const audio = getAudio();
    if (!audio) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const track = stored ? getTrackById(stored) : TRACKS[0];
    const absolute = new URL(track.audio, window.location.origin).href;

    if (audio.src !== absolute) {
      audio.src = track.audio;
      audio.dataset.trackId = track.id;
    }

    updateMiniLabel(track);
    updateActiveStates(track);
    syncButton();
  }

  async function setGlobalTrack(track, shouldPlay = true) {
    const audio = getAudio();
    if (!audio || !track) return;

    const absolute = new URL(track.audio, window.location.origin).href;
    if (audio.src !== absolute) {
      audio.src = track.audio;
      audio.load();
    }

    audio.dataset.trackId = track.id;
    localStorage.setItem(STORAGE_KEY, track.id);
    updateMiniLabel(track);
    updateActiveStates(track);

    if (shouldPlay) {
      try {
        await audio.play();
      } catch (error) {
        console.warn('Audio bloque par le navigateur', error);
      }
    }
    syncButton();
  }

  document.addEventListener('click', async (event) => {
    const playButton = event.target.closest('#playBtn');
    if (playButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const audio = getAudio();
      if (!audio) return;

      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        console.warn('Audio bloque par le navigateur', error);
      }
      syncButton();
      return;
    }

    const trackPlay = event.target.closest('.composition-track .track-play');
    if (trackPlay) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const card = trackPlay.closest('.composition-track');
      await setGlobalTrack(getTrackFromCompositionCard(card), true);
    }
  }, true);

  document.addEventListener('play', (event) => {
    if (event.target?.id === 'audioLoop') syncButton();
  }, true);

  document.addEventListener('pause', (event) => {
    if (event.target?.id === 'audioLoop') syncButton();
  }, true);

  document.addEventListener('DOMContentLoaded', restoreTrack);
  window.addEventListener('pageshow', restoreTrack);

  const observer = new MutationObserver(() => window.requestAnimationFrame(restoreTrack));

  if (document.readyState !== 'loading') {
    restoreTrack();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const app = document.querySelector('#app');
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  }
})();
/* === MARCO PATCH V0.1.0 STABILISATION - END === */

/* === MARCO PATCH v0.2.0 GLOBAL MUSIC DRAWER - START === */
(() => {
  const STORAGE_KEY = 'marco.activeTrack.v6';
  const BODY_CLASS = 'music-drawer-open';

  const TRACKS = [
    { id: '01', title: 'Cinematic Strings', meta: 'Score · Featured', duration: '02:48', audio: '/assets/audio/marco-placeholder-01.wav' },
    { id: '02', title: 'Night Motif', meta: 'Demo · Piano / Strings', duration: '01:36', audio: '/assets/audio/marco-placeholder-02.wav' },
    { id: '03', title: 'Excursion Theme', meta: 'Campaign · Visual', duration: '02:12', audio: '/assets/audio/marco-placeholder-03.wav' },
    { id: '04', title: 'Bow Texture', meta: 'Violin + Score · Atmosphere', duration: '03:10', audio: '/assets/audio/marco-placeholder-04.wav' },
    { id: '05', title: 'Red Cut', meta: 'Original · Pulse', duration: '02:04', audio: '/assets/audio/marco-placeholder-05.wav' },
    { id: '06', title: 'Stage Lines', meta: 'Stage · Scene', duration: '02:52', audio: '/assets/audio/marco-placeholder-06.wav' },
    { id: '07', title: 'Glass Motif', meta: 'Placeholder · Texture', duration: '01:44', audio: '/assets/audio/marco-placeholder-07.wav' },
    { id: '08', title: 'Low Room', meta: 'Placeholder · Ambient', duration: '02:26', audio: '/assets/audio/marco-placeholder-08.wav' },
    { id: '09', title: 'First Cut', meta: 'Placeholder · Draft', duration: '01:58', audio: '/assets/audio/marco-placeholder-09.wav' },
    { id: '10', title: 'End Theme', meta: 'Placeholder · Finale', duration: '03:04', audio: '/assets/audio/marco-placeholder-10.wav' }
  ];

  function getAudio() {
    return document.querySelector('#audioLoop');
  }

  function getPlayButton() {
    return document.querySelector('#playBtn');
  }

  function getTrackById(id) {
    return TRACKS.find((track) => track.id === String(id).padStart(2, '0')) || TRACKS[0];
  }

  function getTrackFromCompositionCard(card) {
    const index = card?.querySelector('.track-index')?.textContent?.trim();
    if (index) return getTrackById(index);

    const title = card?.dataset?.trackTitle || card?.querySelector('.track-title')?.textContent?.trim();
    return TRACKS.find((track) => track.title.toLowerCase() === String(title || '').toLowerCase()) || TRACKS[0];
  }

  function getCurrentTrack() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const audio = getAudio();
    const audioId = audio?.dataset?.trackId;
    return getTrackById(audioId || stored || '01');
  }

  function syncPlayButton() {
    const audio = getAudio();
    const button = getPlayButton();
    if (!audio || !button) return;

    const isPlaying = !audio.paused;
    button.textContent = isPlaying ? 'PAUSE' : 'PLAY';
    button.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-label', isPlaying ? 'Mettre la musique en pause' : 'Lancer la musique');
  }

  function updateMiniLabel(track) {
    const label = document.querySelector('.track-label');
    if (!label || !track) return;
    label.innerHTML = `<b>${track.id}</b><b>${track.title}</b><b>${track.meta}</b>`;
  }

  function updateDrawerNow(track) {
    const audio = getAudio();
    const title = document.querySelector('[data-drawer-now-title]');
    const meta = document.querySelector('[data-drawer-now-meta]');
    const action = document.querySelector('[data-drawer-main-action]');

    if (title) title.textContent = track.title;
    if (meta) meta.textContent = `${track.meta} · ${track.duration}`;
    if (action) action.textContent = audio && !audio.paused ? 'Pause' : 'Play';
  }

  function updateActiveStates(track) {
    document.querySelectorAll('[data-music-track-id]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.musicTrackId === track.id);
    });

    document.querySelectorAll('.composition-track').forEach((card) => {
      const cardTrack = getTrackFromCompositionCard(card);
      card.classList.toggle('is-active', cardTrack.id === track.id);
    });

    updateDrawerNow(track);
  }

  async function setGlobalTrack(track, shouldPlay = true) {
    const audio = getAudio();
    if (!audio || !track) return;

    const absolute = new URL(track.audio, window.location.origin).href;
    if (audio.src !== absolute) {
      audio.src = track.audio;
      audio.load();
    }

    audio.dataset.trackId = track.id;
    localStorage.setItem(STORAGE_KEY, track.id);

    updateMiniLabel(track);
    updateActiveStates(track);

    if (shouldPlay) {
      try {
        await audio.play();
      } catch (error) {
        console.warn('Audio bloque par le navigateur', error);
      }
    }

    syncPlayButton();
    updateDrawerNow(track);
  }

  function closeDrawer() {
    document.body.classList.remove(BODY_CLASS);
    document.querySelector('.music-drawer-toggle')?.classList.remove('is-open');
    document.querySelector('.music-drawer-toggle')?.setAttribute('aria-expanded', 'false');
  }

  function toggleDrawer(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !document.body.classList.contains(BODY_CLASS);
    document.body.classList.toggle(BODY_CLASS, shouldOpen);

    const toggle = document.querySelector('.music-drawer-toggle');
    toggle?.classList.toggle('is-open', shouldOpen);
    toggle?.setAttribute('aria-expanded', String(shouldOpen));
  }

  function buildDrawer() {
    const drawer = document.createElement('div');
    drawer.className = 'music-drawer-sheet';
    drawer.setAttribute('data-music-drawer', '');

    drawer.innerHTML = `
      <section class="music-drawer-now" aria-label="Morceau actif">
        <span class="music-drawer-eyebrow">Now playing</span>
        <strong data-drawer-now-title>Cinematic Strings</strong>
        <span data-drawer-now-meta>Score · Featured · 02:48</span>
        <button class="music-drawer-main-action" type="button" data-drawer-main-action>Play</button>
      </section>
      <section class="music-drawer-library" aria-label="Bibliothèque musicale globale">
        <div class="music-drawer-header">
          <strong>Music Library</strong>
          <span>Disponible sur toutes les pages</span>
        </div>
        <div class="music-drawer-list">
          ${TRACKS.map((track) => `
            <button class="music-drawer-track" type="button" data-music-track-id="${track.id}">
              <span class="music-drawer-index">${track.id}</span>
              <span class="music-drawer-name"><strong>${track.title}</strong><span>${track.meta}</span></span>
              <span class="music-drawer-duration">${track.duration}</span>
              <span class="music-drawer-action">Play</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;

    drawer.addEventListener('click', (event) => {
      const mainAction = event.target.closest('[data-drawer-main-action]');
      if (mainAction) {
        event.preventDefault();
        event.stopPropagation();

        const audio = getAudio();
        if (!audio) return;

        if (audio.paused) {
          audio.play().catch((error) => console.warn('Audio bloque par le navigateur', error));
        } else {
          audio.pause();
        }

        window.setTimeout(() => {
          syncPlayButton();
          updateDrawerNow(getCurrentTrack());
        }, 40);
        return;
      }

      const trackButton = event.target.closest('[data-music-track-id]');
      if (!trackButton) return;

      event.preventDefault();
      event.stopPropagation();
      setGlobalTrack(getTrackById(trackButton.dataset.musicTrackId), true);
    });

    return drawer;
  }

  function ensureDrawer() {
    const miniPlayer = document.querySelector('.mini-player');
    if (!miniPlayer) return;

    miniPlayer.querySelector('.music-taskbar-panel')?.remove();
    miniPlayer.querySelector('.music-panel')?.remove();
    miniPlayer.querySelector('.music-library-panel')?.remove();

    let toggle = miniPlayer.querySelector('.music-drawer-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'music-drawer-toggle';
  toggle.setAttribute('aria-label', 'Ouvrir la bibliothèque musicale');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span>Musiques</span><i class="music-drawer-arrow" aria-hidden="true">↑</i>';
      miniPlayer.appendChild(toggle);

      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleDrawer();
      });
    }

    if (!document.querySelector('[data-music-drawer]')) {
      document.body.appendChild(buildDrawer());
    }
  }

  function restoreTrack() {
    ensureDrawer();

    const track = getCurrentTrack();
    const audio = getAudio();

    if (audio && audio.dataset.trackId !== track.id) {
      audio.src = track.audio;
      audio.dataset.trackId = track.id;
    }

    updateMiniLabel(track);
    updateActiveStates(track);
    syncPlayButton();
  }

  document.addEventListener('click', (event) => {
    const compositionPlay = event.target.closest('.composition-track .track-play');
    if (compositionPlay) {
      event.preventDefault();
      event.stopPropagation();
      setGlobalTrack(getTrackFromCompositionCard(compositionPlay.closest('.composition-track')), true);
      return;
    }

    if (
      !event.target.closest('[data-music-drawer]') &&
      !event.target.closest('.music-drawer-toggle')
    ) {
      closeDrawer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  document.addEventListener('play', (event) => {
    if (event.target?.id === 'audioLoop') {
      syncPlayButton();
      updateDrawerNow(getCurrentTrack());
    }
  }, true);

  document.addEventListener('pause', (event) => {
    if (event.target?.id === 'audioLoop') {
      syncPlayButton();
      updateDrawerNow(getCurrentTrack());
    }
  }, true);

  document.addEventListener('DOMContentLoaded', restoreTrack);
  window.addEventListener('pageshow', restoreTrack);

  const observer = new MutationObserver(() => window.requestAnimationFrame(restoreTrack));

  if (document.readyState !== 'loading') {
    restoreTrack();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const app = document.querySelector('#app');
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  }
})();
/* === MARCO PATCH v0.2.0 GLOBAL MUSIC DRAWER - END === */

/* === MARCO PATCH v0.3.0 GLOBAL NAVIGATION - START === */
/*
  MARCO PATCH v0.3.0
  Type : navigation globale
  Cible : rail + scroll molette
*/
(() => {
  const WHEEL_LOCK_MS = 880;
  const WHEEL_THRESHOLD = 72;

  const pages = [
    { id: 'home', href: '/index.html', accent: '#86f5a8' },
    { id: 'music', href: '/music.html', accent: '#f4bd68' },
    { id: 'parcours', href: '/parcours.html', accent: '#73aaf6' },
    { id: 'gallery', href: '/gallery.html', accent: '#f08ac8' },
    { id: 'filmographie', href: '/filmographie.html', accent: '#f4bd68' },
    { id: 'composition', href: '/composition.html', accent: '#ff355d' },
    { id: 'booking', href: '/contact.html', accent: '#d8c3ff' }
  ];

  let wheelLocked = false;
  let wheelBuffer = 0;
  let syncFrame = 0;

  function detectMarcoPage() {
    const page = document.querySelector('#app .page');
    const dataPage = page?.dataset?.page;
    const dataTheme = page?.dataset?.theme;
    const path = window.location.pathname.toLowerCase();

    if (dataPage === 'home' || dataTheme === 'home' || path.endsWith('/') || path.includes('index')) return 'home';
    if (dataPage === 'composition' || dataTheme === 'composition' || path.includes('composition')) return 'composition';
    if (dataPage === 'parcours' || dataTheme === 'parcours' || path.includes('parcours')) return 'parcours';
    if (dataPage === 'filmographie' || dataTheme === 'filmographie' || path.includes('filmographie')) return 'filmographie';
    if (dataPage === 'music' || dataTheme === 'music' || path.includes('music') || path.includes('violon')) return 'music';
    if (dataPage === 'gallery' || dataTheme === 'gallery' || path.includes('gallery') || path.includes('modele')) return 'gallery';
    if (dataPage === 'booking' || dataTheme === 'booking' || path.includes('contact')) return 'booking';
    if (dataPage === 'scores' || dataTheme === 'scores' || path.includes('projects')) return 'composition';

    return 'home';
  }

  function getPageInfo(id = detectMarcoPage()) {
    return pages.find((page) => page.id === id) || pages[0];
  }

  function syncGlobalNavTheme() {
    const activeId = detectMarcoPage();
    const active = getPageInfo(activeId);

    document.body.dataset.marcoPage = active.id;
    document.documentElement.style.setProperty('--marco-nav-accent', active.accent);

    const nav = document.querySelector('[data-chapter-nav]');
    if (!nav) return;

    nav.dataset.activePage = active.id;
    nav.style.setProperty('--marco-nav-accent', active.accent);
  }

  function requestSyncGlobalNavTheme() {
    if (syncFrame) return;

    syncFrame = window.requestAnimationFrame(() => {
      syncFrame = 0;
      syncGlobalNavTheme();
    });
  }

  function isInsideInternalScroller(target) {
    if (!(target instanceof Element)) return false;

    if (
      target.closest('input, textarea, select, option, button, [contenteditable="true"]') &&
      !target.closest('[data-chapter-nav]')
    ) {
      return true;
    }

    if (
      target.closest(
        '.composition-track-scroll, .composition-diagonal-zone, .music-drawer-sheet, .music-drawer-list, [data-music-drawer], .contact-form, .contact-card, .contact-panel, [data-no-page-wheel]'
      )
    ) {
      return true;
    }

    let node = target;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.closest && node.closest('[data-chapter-nav]')) return false;

      const style = window.getComputedStyle(node);
      const canScrollY = /(auto|scroll)/.test(style.overflowY);
      const hasRealScroll = node.scrollHeight > node.clientHeight + 6;

      if (canScrollY && hasRealScroll) {
        return true;
      }

      node = node.parentElement;
    }

    return false;
  }

  function navigateRelativePage(direction) {
    const activeId = detectMarcoPage();
    const currentIndex = Math.max(0, pages.findIndex((page) => page.id === activeId));
    const targetIndex = Math.min(pages.length - 1, Math.max(0, currentIndex + direction));

    if (targetIndex === currentIndex) return;

    const target = pages[targetIndex];
    const navLink = document.querySelector(`[data-chapter-nav] .chapter-link[data-chapter-id="${target.id}"]`);

    document.body.classList.add('marco-page-wheel-locked');
    window.setTimeout(() => document.body.classList.remove('marco-page-wheel-locked'), 320);

    if (navLink) {
      navLink.click();
    } else {
      window.location.href = target.href;
    }

    window.setTimeout(requestSyncGlobalNavTheme, 90);
    window.setTimeout(requestSyncGlobalNavTheme, 360);
  }

  function onGlobalWheel(event) {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

    const target = event.target;
    const onRail = target instanceof Element && Boolean(target.closest('[data-chapter-nav]'));

    if (!onRail && isInsideInternalScroller(target)) return;

    if (wheelLocked) {
      event.preventDefault();
      return;
    }

    wheelBuffer += event.deltaY;

    if (Math.abs(wheelBuffer) < WHEEL_THRESHOLD) {
      event.preventDefault();
      return;
    }

    const direction = wheelBuffer > 0 ? 1 : -1;
    wheelBuffer = 0;
    wheelLocked = true;

    event.preventDefault();
    navigateRelativePage(direction);

    window.setTimeout(() => {
      wheelLocked = false;
      wheelBuffer = 0;
    }, WHEEL_LOCK_MS);
  }

  document.addEventListener('wheel', onGlobalWheel, { passive: false });

  document.addEventListener('DOMContentLoaded', requestSyncGlobalNavTheme);
  window.addEventListener('pageshow', requestSyncGlobalNavTheme);
  window.addEventListener('popstate', requestSyncGlobalNavTheme);

  const observer = new MutationObserver(requestSyncGlobalNavTheme);

  function bootObserver() {
    requestSyncGlobalNavTheme();

    const app = document.querySelector('#app');
    if (app && !app.dataset.marcoGlobalNavObserved) {
      app.dataset.marcoGlobalNavObserved = 'true';
      observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-page', 'data-theme', 'class'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootObserver);
  } else {
    bootObserver();
  }
})();
/* === MARCO PATCH v0.3.0 GLOBAL NAVIGATION - END === */

