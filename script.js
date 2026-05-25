(() => {
  const app = document.querySelector('#app');
  if (!app) return;

  const order = ['home', 'music', 'parcours', 'gallery', 'filmographie', 'composition', 'scores', 'booking'];
  let currentPage = app.querySelector('.page')?.dataset.page || 'home';
  let busy = false;

  const band = document.createElement('div');
  band.className = 'transition-band';
  band.setAttribute('aria-hidden', 'true');
  band.innerHTML = '<span></span>';
  document.body.appendChild(band);

  const pageFromPath = (path) => {
    const file = path.split('/').pop() || 'index.html';
    if (file.includes('music')) return 'music';
    if (file.includes('composition')) return 'composition';
    if (file.includes('parcours')) return 'parcours';
    if (file.includes('filmographie')) return 'filmographie';
    if (file.includes('composition')) return 'composition';
    if (file.includes('projects')) return 'scores';
    if (file.includes('gallery')) return 'gallery';
    if (file.includes('contact')) return 'booking';
    return 'home';
  };

  const transitionLabel = (page, fallback) => (
    page?.dataset.transitionLabel ||
    page?.querySelector('.mega.first')?.textContent?.trim() ||
    fallback.toUpperCase()
  );

  function runBand(label, page) {
    const accent = getComputedStyle(page).getPropertyValue('--accent').trim() || '#86f8a7';
    band.style.setProperty('--band-accent', accent);
    band.querySelector('span').textContent = label;
    band.classList.remove('is-active');
    void band.offsetWidth;
    band.classList.add('is-active');
  }

  async function goTo(url, push = true) {
    if (busy) return;
    const absolute = new URL(url, window.location.href);
    if (absolute.href === window.location.href && app.querySelector('.page')) return;

    busy = true;
    document.body.classList.add('is-transitioning');

    try {
      const res = await fetch(absolute.pathname, { headers: { 'X-PJAX': 'true' }});
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const next = doc.querySelector('#app .page');
      if (!next) throw new Error('Page PJAX introuvable');

      const fromIndex = order.indexOf(currentPage);
      const nextPage = pageFromPath(absolute.pathname);
      const toIndex = order.indexOf(nextPage);
      const forward = toIndex >= fromIndex;
      const current = app.querySelector('.page');

      next.classList.add(forward ? 'slide-from-right' : 'slide-from-left');
      app.appendChild(next);
      runBand(transitionLabel(next, nextPage), next);

      if (current) {
        current.classList.add(forward ? 'slide-out-left' : 'slide-out-right', 'is-leaving');
      }

      window.setTimeout(() => {
        [...app.querySelectorAll('.page.is-leaving')].forEach((el) => el.remove());
        next.classList.remove('slide-from-right', 'slide-from-left');
        currentPage = next.dataset.page || nextPage;
        if (push) history.pushState({ page: currentPage }, '', absolute.pathname);
        document.title = doc.title || document.title;
        document.body.classList.remove('is-transitioning');
        busy = false;
      }, 920);
    } catch (err) {
      console.error(err);
      window.location.href = absolute.href;
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

  const audio = document.querySelector('#audioLoop');
  const play = document.querySelector('#playBtn');
  let playing = false;

  if (play && audio) {
    play.addEventListener('click', async () => {
      try {
        if (!playing) {
          await audio.play();
          playing = true;
          play.textContent = 'PAUSE';
        } else {
          audio.pause();
          playing = false;
          play.textContent = 'PLAY';
        }
      } catch (e) {
        console.warn('Audio bloque par le navigateur', e);
      }
    });
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


/* === MARCO COMPOSITION TRACK SCROLL CONTROLS - START === */
(() => {
  function getCompositionScroller(button) {
    const zone = button.closest('.composition-diagonal-zone');
    return zone?.querySelector('.composition-track-scroll') || null;
  }

  function updateCompositionTrackButtons(zone) {
    const scroller = zone?.querySelector('.composition-track-scroll');
    if (!scroller) return;

    const up = zone.querySelector('[data-track-scroll="up"]');
    const down = zone.querySelector('[data-track-scroll="down"]');
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

    up?.classList.toggle('is-disabled', scroller.scrollTop <= 4);
    down?.classList.toggle('is-disabled', scroller.scrollTop >= maxScroll - 4);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-track-scroll]');
    if (!button) return;

    const scroller = getCompositionScroller(button);
    if (!scroller) return;

    const direction = button.dataset.trackScroll === 'up' ? -1 : 1;
    const amount = Math.max(120, Math.round(scroller.clientHeight * 0.58));

    scroller.scrollBy({
      top: direction * amount,
      behavior: 'smooth'
    });

    window.setTimeout(() => {
      updateCompositionTrackButtons(button.closest('.composition-diagonal-zone'));
    }, 260);
  });

  document.addEventListener('scroll', (event) => {
    if (!event.target?.classList?.contains('composition-track-scroll')) return;
    updateCompositionTrackButtons(event.target.closest('.composition-diagonal-zone'));
  }, true);

  function initCompositionTrackButtons() {
    document.querySelectorAll('.composition-diagonal-zone').forEach((zone) => {
      updateCompositionTrackButtons(zone);
    });
  }

  document.addEventListener('DOMContentLoaded', initCompositionTrackButtons);
  window.addEventListener('resize', initCompositionTrackButtons);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(initCompositionTrackButtons);
  });

  if (document.readyState !== 'loading') {
    initCompositionTrackButtons();
    const app = document.querySelector('#app');
    if (app) observer.observe(app, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const app = document.querySelector('#app');
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  }
})();
/* === MARCO COMPOSITION TRACK SCROLL CONTROLS - END === */


/* === MARCO COMPOSITION TRACK LOOP OVERRIDE - START === */
(() => {
  function loopScrollCompositionTracks(button) {
    const zone = button.closest('.composition-diagonal-zone');
    const scroller = zone?.querySelector('.composition-track-scroll');
    if (!scroller) return;

    const direction = button.dataset.trackScroll === 'up' ? -1 : 1;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const amount = Math.max(132, Math.round(scroller.clientHeight * 0.62));

    let nextTop = scroller.scrollTop + direction * amount;

    if (direction > 0 && nextTop >= maxScroll - 8) {
      nextTop = 0;
    }

    if (direction < 0 && nextTop <= 8) {
      nextTop = maxScroll;
    }

    scroller.scrollTo({
      top: nextTop,
      behavior: 'smooth'
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.composition-track-step[data-track-scroll]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    loopScrollCompositionTracks(button);
  }, true);
})();
/* === MARCO COMPOSITION TRACK LOOP OVERRIDE - END === */
