(() => {
  const app = document.querySelector('#app');
  const order = ['home','music','scores','gallery','booking'];
  let currentPage = app.querySelector('.page')?.dataset.page || 'home';
  let busy = false;

  const pageFromPath = (path) => {
    const file = path.split('/').pop() || 'index.html';
    if (file.includes('music')) return 'music';
    if (file.includes('projects')) return 'scores';
    if (file.includes('gallery')) return 'gallery';
    if (file.includes('contact')) return 'booking';
    return 'home';
  };

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
      if (current) current.classList.add(forward ? 'slide-out-left' : 'slide-out-right', 'is-leaving');

      window.setTimeout(() => {
        [...app.querySelectorAll('.page.is-leaving')].forEach(el => el.remove());
        next.classList.remove('slide-from-right','slide-from-left');
        currentPage = next.dataset.page || nextPage;
        if (push) history.pushState({ page: currentPage }, '', absolute.pathname);
        document.title = doc.title || document.title;
        document.body.classList.remove('is-transitioning');
        busy = false;
      }, 880);
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
        if (!playing) { await audio.play(); playing = true; play.textContent = 'PAUSE'; }
        else { audio.pause(); playing = false; play.textContent = 'PLAY'; }
      } catch (e) { console.warn('Audio bloqué par le navigateur', e); }
    });
  }

  const canvas = document.querySelector('#dotWave');
  const ctx = canvas.getContext('2d');
  let t = 0;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize, { passive:true });
  resize();

  function peak(x, center, width, amp) {
    return Math.exp(-Math.pow((x - center) / width, 2)) * amp;
  }

  function draw() {
    const w = window.innerWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0,0,w,h);
    const spacingX = Math.max(10, Math.min(15, w / 150));
    const spacingY = 7.4;
    const radius = Math.max(1.05, Math.min(1.55, w / 1180));
    const base = h - 18;
    t += 0.018;

    for (let x = -20, i = 0; x < w + 20; x += spacingX, i++) {
      const motion = Math.sin(i*.31 + t*3.0) * .5 + .5;
      const jitter = Math.sin(i*.71 + t*4.8) * .5 + .5;
      const energy =
        peak(x, w*.03,  w*.020, 2.8 + .8*Math.sin(t*2.1)) +
        peak(x, w*.31,  w*.042, 2.2 + .8*Math.cos(t*1.7)) +
        peak(x, w*.38,  w*.026, 3.1 + .8*Math.sin(t*2.6)) +
        peak(x, w*.72,  w*.034, 2.0 + .7*Math.cos(t*2.4)) +
        peak(x, w*.84,  w*.030, 2.6 + .8*Math.sin(t*2.1));
      let count = Math.max(1, Math.round(1 + energy + motion*.55));
      if (jitter > .93) count += 1;
      count = Math.min(count, 6);

      for (let j = 0; j < count; j++) {
        const alpha = Math.max(.12, .66 - j*.055);
        const y = base - j*spacingY;
        ctx.beginPath();
        ctx.fillStyle = `rgba(115,249,155,${alpha})`;
        ctx.shadowColor = 'rgba(115,249,155,.62)';
        ctx.shadowBlur = j === 0 ? 4 : 6;
        ctx.arc(x, y, radius, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 4;
    for (let x = -20; x < w + 20; x += spacingX) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(115,249,155,.36)';
      ctx.arc(x, base + 5, radius*.68, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - .5);
    const y = (e.clientY / window.innerHeight - .5);
    const title = app.querySelector('.title-wrap');
    if (title) title.style.translate = `${x*-5}px ${y*3}px`;
  }, { passive:true });
})();
