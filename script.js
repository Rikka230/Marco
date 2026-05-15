(() => {
  const app = document.querySelector('#app');
  if (!app) return;

  const order = ['home', 'music', 'scores', 'gallery', 'booking'];
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
    const pageLift = pageName === 'music' ? 1.16 : pageName === 'scores' ? 0.88 : pageName === 'gallery' ? 1.02 : 0.96;

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
