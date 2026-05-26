/* === MARCO PATCH v0.5.2 MODELE FILM STRIPS 60FPS LOOP ENGINE === */
(() => {
  const state = {
    raf: null,
    tracks: new Set(),
    lightbox: null,
    frames: [],
    index: 0,
    lastTime: 0
  };

  const DEFAULT_SPEED = 56;
  const LEGACY_SPEED_SCALE = 260;
  const MANUAL_PAUSE_MS = 240;

  function uniqueFrames() {
    return [...document.querySelectorAll('.model-page .model-frame:not([data-clone="true"])')];
  }

  function getLoopWidth(track) {
    const row = track.querySelector('.model-strip-row');
    if (!row) return 0;
    return Number(row.dataset.loopWidth || 0);
  }

  function calculateLoopWidth(row, originals) {
    const styles = window.getComputedStyle(row);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const width = originals.reduce((total, node) => total + node.getBoundingClientRect().width, 0);
    return Math.max(1, width + gap * originals.length);
  }

  function syncProgress(track) {
    const strip = track.closest('.model-strip');
    const progress = strip?.querySelector('.model-strip-progress span');
    const loopWidth = getLoopWidth(track);
    if (!progress || !loopWidth) return;

    const raw = ((track.scrollLeft % loopWidth) + loopWidth) % loopWidth;
    const percent = Math.max(8, Math.min(100, (raw / loopWidth) * 100));
    progress.style.setProperty('--model-progress', `${percent}%`);
  }

  function cloneTrack(track) {
    const row = track.querySelector('.model-strip-row');
    if (!row) return;

    if (row.dataset.cloned !== 'true') {
      const originals = [...row.children];

      window.requestAnimationFrame(() => {
        const loopWidth = calculateLoopWidth(row, originals);
        row.dataset.loopWidth = String(loopWidth);

        for (let repeat = 0; repeat < 4; repeat += 1) {
          originals.forEach((node) => {
            const clone = node.cloneNode(true);
            clone.dataset.clone = 'true';
            clone.setAttribute('aria-hidden', 'true');
            row.appendChild(clone);
          });
        }

        track.scrollLeft = loopWidth;
        syncProgress(track);
      });

      row.dataset.cloned = 'true';
      return;
    }

    if (!getLoopWidth(track)) {
      const originals = [...row.querySelectorAll('.model-frame:not([data-clone="true"])')];
      row.dataset.loopWidth = String(calculateLoopWidth(row, originals));
    }
  }

  function normalizeLoop(track) {
    const loopWidth = getLoopWidth(track);
    if (!loopWidth) return;

    while (track.scrollLeft >= loopWidth * 2) {
      track.scrollLeft -= loopWidth;
    }

    while (track.scrollLeft < loopWidth) {
      track.scrollLeft += loopWidth;
    }
  }

  function bindTrack(track) {
    if (!track || track.dataset.modelBound === 'true') return;
    track.dataset.modelBound = 'true';
    cloneTrack(track);
    state.tracks.add(track);

    track.addEventListener('scroll', () => syncProgress(track), { passive: true });

    track.addEventListener('wheel', (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;

      event.preventDefault();
      event.stopPropagation();
      track.dataset.manualUntil = String(performance.now() + MANUAL_PAUSE_MS);
      track.scrollLeft += delta;
      normalizeLoop(track);
      syncProgress(track);
    }, { passive: false });
  }

  function resolveSpeed(track) {
    const value = Number(track.dataset.speed);
    if (!Number.isFinite(value) || value === 0) return DEFAULT_SPEED;

    // v0.5.0 used tiny per-frame values like 0.19. Keep compatibility
    // but convert them to visible pixels/second for a true autonomous loop.
    if (Math.abs(value) <= 2) return value * LEGACY_SPEED_SCALE;
    return value;
  }

  function tick(now = performance.now()) {
    state.raf = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const previous = state.lastTime || now - 16.666;
    const deltaSeconds = Math.min(1 / 30, Math.max(1 / 120, (now - previous) / 1000));
    state.lastTime = now;

    state.tracks.forEach((track) => {
      if (!track.isConnected) {
        state.tracks.delete(track);
        return;
      }

      const page = track.closest('.model-page');
      const isActiveModelPage = page && page.isConnected && !page.classList.contains('is-leaving');
      const isManual = Number(track.dataset.manualUntil || 0) > now;
      const isLightboxOpen = document.body.classList.contains('model-lightbox-open');

      if (!reduceMotion && isActiveModelPage && !isManual && !isLightboxOpen) {
        const speed = resolveSpeed(track);
        track.scrollLeft += speed * deltaSeconds;
        normalizeLoop(track);
        syncProgress(track);
      }
    });

    startLoop();
  }

  function startLoop() {
    if (state.raf !== null) return;
    state.raf = window.requestAnimationFrame(tick);
  }

  function ensureLightbox() {
    if (state.lightbox?.isConnected) return state.lightbox;

    const lightbox = document.createElement('div');
    lightbox.className = 'model-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Photo modèle en grand format');
    lightbox.innerHTML = `
      <div class="model-lightbox-panel" data-lightbox-panel>
        <button class="model-lightbox-close" type="button" data-lightbox-close aria-label="Fermer">×</button>
        <button class="model-lightbox-arrow model-lightbox-prev" type="button" data-lightbox-prev aria-label="Photo précédente">‹</button>
        <div class="model-lightbox-image-wrap">
          <img src="" alt="" data-lightbox-img />
        </div>
        <div class="model-lightbox-info">
          <span class="model-lightbox-count" data-lightbox-count></span>
          <h2 class="model-lightbox-title" data-lightbox-title></h2>
          <p class="model-lightbox-meta" data-lightbox-meta></p>
        </div>
        <button class="model-lightbox-arrow model-lightbox-next" type="button" data-lightbox-next aria-label="Photo suivante">›</button>
      </div>
    `;

    document.body.appendChild(lightbox);
    state.lightbox = lightbox;
    return lightbox;
  }

  function frameFromClone(frame) {
    if (!frame?.dataset?.clone) return frame;
    return uniqueFrames().find((item) => item.dataset.photoId === frame.dataset.photoId) || frame;
  }

  function renderLightbox() {
    const lightbox = ensureLightbox();
    const frame = state.frames[state.index];
    if (!frame) return;

    const img = lightbox.querySelector('[data-lightbox-img]');
    const title = lightbox.querySelector('[data-lightbox-title]');
    const meta = lightbox.querySelector('[data-lightbox-meta]');
    const count = lightbox.querySelector('[data-lightbox-count]');

    const src = frame.dataset.src || frame.querySelector('img')?.src || '';
    const label = frame.dataset.title || frame.querySelector('span')?.textContent?.trim() || 'Model visual';
    const description = frame.dataset.meta || 'MODELE / PHOTO / PORTFOLIO';

    img.src = src;
    img.alt = label;
    title.textContent = label;
    meta.textContent = description;
    count.textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(state.frames.length).padStart(2, '0')}`;
  }

  function openLightbox(frame) {
    const source = frameFromClone(frame);
    state.frames = uniqueFrames();
    state.index = Math.max(0, state.frames.findIndex((item) => item.dataset.photoId === source.dataset.photoId));

    const lightbox = ensureLightbox();
    renderLightbox();
    lightbox.classList.add('is-open');
    document.body.classList.add('model-lightbox-open');
    lightbox.querySelector('[data-lightbox-close]')?.focus({ preventScroll: true });
  }

  function closeLightbox() {
    const lightbox = ensureLightbox();
    lightbox.classList.remove('is-open');
    document.body.classList.remove('model-lightbox-open');
  }

  function moveLightbox(offset) {
    if (!state.frames.length) return;
    state.index = (state.index + offset + state.frames.length) % state.frames.length;
    renderLightbox();
  }

  function bindGlobalEvents() {
    if (document.documentElement.dataset.modelGlobalEvents === 'true') return;
    document.documentElement.dataset.modelGlobalEvents = 'true';

    document.addEventListener('click', (event) => {
      const frame = event.target.closest('.model-page .model-frame');
      if (frame) {
        event.preventDefault();
        event.stopPropagation();
        openLightbox(frame);
        return;
      }

      if (event.target.closest('[data-lightbox-close]')) {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.target.closest('[data-lightbox-prev]')) {
        event.preventDefault();
        moveLightbox(-1);
        return;
      }

      if (event.target.closest('[data-lightbox-next]')) {
        event.preventDefault();
        moveLightbox(1);
        return;
      }

      const lightbox = event.target.closest('.model-lightbox.is-open');
      const panel = event.target.closest('[data-lightbox-panel]');
      if (lightbox && !panel) closeLightbox();
    }, true);

    document.addEventListener('keydown', (event) => {
      if (!document.body.classList.contains('model-lightbox-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveLightbox(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveLightbox(1);
      }
    });

    document.addEventListener('visibilitychange', () => {
      state.lastTime = performance.now();
    });
  }

  function initModelPage() {
    bindGlobalEvents();
    document.querySelectorAll('.model-page .model-strip-track').forEach(bindTrack);
    if (!state.lastTime) state.lastTime = performance.now();
    startLoop();
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(initModelPage);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initModelPage();
      const app = document.querySelector('#app');
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  } else {
    initModelPage();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
})();
