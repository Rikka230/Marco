// dotWave — port fidele du visualizer canvas de script.js (CORE).
// Le canvas #dotWave est persiste (transition:persist) ; la boucle RAF demarre une fois
// et lit la page active + l'accent + l'etat de lecture a chaque frame (zero couplage PJAX).

interface RGB { r: number; g: number; b: number; }

function parseColor(color: string): RGB {
  const rgb = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  const hex = color.replace('#', '').trim();
  if (hex.length === 6) {
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }
  return { r: 134, g: 248, b: 167 };
}

const rgba = (rgb: RGB, alpha: number) => `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
const peak = (x: number, center: number, width: number, amp: number) => Math.exp(-Math.pow((x - center) / width, 2)) * amp;

function activePage(): HTMLElement | null {
  const app = document.querySelector('#app');
  return app?.querySelector<HTMLElement>('.page:not(.is-leaving)') || app?.querySelector<HTMLElement>('.page') || null;
}

let started = false;

export function initDotWave() {
  if (started) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#dotWave');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  started = true;

  let waveFrame: number | null = null;
  let lastWave = 0;
  let t = 0;

  const isPlaying = () => {
    const audio = document.querySelector<HTMLAudioElement>('#audioLoop');
    return !!audio && !audio.paused;
  };

  function activeAccent(): RGB {
    const page = activePage();
    const color = page ? getComputedStyle(page).getPropertyValue('--accent').trim() : '';
    return parseColor(color || 'rgb(134, 248, 167)');
  }

  function resize() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const pageName = page?.dataset.page || document.body.dataset.marcoPage || 'home';
    const accent = activeAccent();
    const playing = isPlaying();
    const transitioning = document.body.classList.contains('is-transitioning');
    const frameInterval = playing ? 16 : transitioning ? 50 : 33;
    if (lastWave && now - lastWave < frameInterval) { startWave(); return; }
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
}
