/* === MARCO PATCH v0.5.5 MODELE FILM STRIPS AUTOSCROLL FIX === */
(() => {
  const state = {
    raf: null,
    running: false,
    tracks: new Map(),
    lightbox: null,
    frames: [],
    index: 0,
    lastTime: 0
  };

  const DEFAULT_SPEED = 64;
  const MANUAL_PAUSE_MS = 260;
  const CLONE_SETS = 6;

  function uniqueFrames() {
    return [...document.querySelectorAll('.model-page .model-frame:not([data-clone="true"])')];
  }

  function modulo(value, width) {
    if (!width) return 0;
    return ((value % width) + width) % width;
  }

  function calculateLoopWidth(row, originals) {
    if (!row || !originals.length) return 0;
    const styles = window.getComputedStyle(row);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const width = originals.reduce((total, node) => total + node.getBoundingClientRect().width, 0);
    return Math.max(1, width + gap * Math.max(0, originals.length - 1));
  }

  function applyTrackPosition(track, data) {
    if (!track || !data?.row || !data.loopWidth) return;
    data.offset = modulo(data.offset, data.loopWidth);
    data.row.style.transform = `translate3d(${-data.offset}px, 0, 0)`;
    syncProgress(track, data);
  }

  function syncProgress(track, data = state.tracks.get(track)) {
    const strip = track?.closest('.model-strip');
    const progress = strip?.querySelector('.model-strip-progress span');
    if (!progress || !data?.loopWidth) return;

    const raw = modulo(data.offset, data.loopWidth);
    const percent = Math.max(8, Math.min(100, (raw / data.loopWidth) * 100));
    progress.style.setProperty('--model-progress', `${percent}%`);
  }

  function rebuildTrack(track) {
    const row = track?.querySelector('.model-strip-row');
    if (!row) return null;

    row.querySelectorAll('[data-clone="true"]').forEach((clone) => clone.remove());
    const originals = [...row.querySelectorAll('.model-frame:not([data-clone="true"])')];
    originals.forEach((node) => {
      node.style.removeProperty('transform');
    });

    const data = state.tracks.get(track) || {
      row,
      offset: 0,
      loopWidth: 0,
      speed: DEFAULT_SPEED,
      manualUntil: 0
    };

    data.row = row;
    data.speed = Number(track.dataset.speed || DEFAULT_SPEED);

    window.requestAnimationFrame(() => {
      data.loopWidth = calculateLoopWidth(row, originals);
      row.dataset.loopWidth = String(data.loopWidth);

      for (let repeat = 0; repeat < CLONE_SETS; repeat += 1) {
        originals.forEach((node) => {
          const clone = node.cloneNode(true);
          clone.dataset.clone = 'true';
          clone.setAttribute('aria-hidden', 'true');
          clone.tabIndex = -1;
          row.appendChild(clone);
        });
      }

      data.offset = modulo(data.offset || 0, data.loopWidth);
      state.tracks.set(track, data);
      applyTrackPosition(track, data);
    });

    return data;
  }

  function bindTrack(track) {
    if (!track || track.dataset.modelBound === 'true') return;
    track.dataset.modelBound = 'true';
    track.scrollLeft = 0;
    track.style.scrollBehavior = 'auto';
    rebuildTrack(track);

    track.addEventListener('wheel', (event) => {
      const data = state.tracks.get(track);
      if (!data?.loopWidth) return;

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;

      event.preventDefault();
      event.stopPropagation();
      data.manualUntil = performance.now() + MANUAL_PAUSE_MS;
      data.offset += delta;
      applyTrackPosition(track, data);
    }, { passive: false });
  }

  function tick(now = performance.now()) {
    state.raf = null;
    const deltaSeconds = Math.min(0.05, Math.max(0.001, ((now - (state.lastTime || now)) / 1000) || (1 / 60)));
    state.lastTime = now;

    state.tracks.forEach((data, track) => {
      if (!track.isConnected) {
        state.tracks.delete(track);
        return;
      }

      const page = track.closest('.model-page');
      const activeModelPage = page && page.isConnected && !page.classList.contains('is-leaving');
      const manuallyBrowsing = data.manualUntil > now;
      const lightboxOpen = document.body.classList.contains('model-lightbox-open');

      if (activeModelPage && !manuallyBrowsing && !lightboxOpen && data.loopWidth) {
        data.offset += data.speed * deltaSeconds;
        applyTrackPosition(track, data);
      }
    });

    startLoop();
  }

  function startLoop() {
    if (state.raf !== null || !state.running) return;
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

    window.addEventListener('resize', () => {
      document.querySelectorAll('.model-page .model-strip-track').forEach(rebuildTrack);
    }, { passive: true });
  }

  function initModelPage() {
    bindGlobalEvents();
    document.querySelectorAll('.model-page .model-strip-track').forEach(bindTrack);
    if (!state.lastTime) state.lastTime = performance.now();
    startLoop();
  }

  // Cycle de vie PageTransition : la boucle d'animation ne tourne que sur la page Modèle active.
  function enterModelPage() {
    state.running = true;
    initModelPage();
  }

  function cleanupModelPage() {
    state.running = false;
    if (state.raf !== null) { window.cancelAnimationFrame(state.raf); state.raf = null; }
  }

  if (window.Marco && typeof window.Marco.registerPage === 'function') {
    window.Marco.registerPage('gallery', { enter: enterModelPage, cleanup: cleanupModelPage });
  } else {
    // Filet de sécurité si le seam n'est pas chargé.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enterModelPage);
    } else {
      enterModelPage();
    }
  }
})();
