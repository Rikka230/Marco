// Phase C — transitions cinematiques pilotees en JS via la Web Animations API.
// Choix: WAAPI (element.animate) au lieu des View Transitions d'Astro, car Astro
// DESACTIVE toutes ses transitions (meme le fallback) quand prefer-reduced-motion
// est actif. La WAAPI, elle, joue les animations quel que soit ce reglage -> on
// force ainsi le wipe sur tous les appareils/navigateurs (Opera GX compris).
// On garde ClientRouter (nav SPA + transition:persist audio) ; on anime nous-memes
// la page entrante sur astro:after-swap + la bande sur astro:before-swap.

import { perf } from './perf';

const ORDER = ['home', 'music', 'parcours', 'gallery', 'filmographie', 'composition', 'scores', 'booking'];

const ACCENTS: Record<string, string> = {
  home: '#86f5a8', music: '#f4bd68', parcours: '#73aaf6', gallery: '#f08ac8',
  filmographie: '#f4bd68', composition: '#ff355d', scores: '#ff355d', booking: '#d8c3ff',
};
const LABELS: Record<string, string> = {
  home: 'MARCO', music: 'VIOLIN', parcours: 'PARCOURS', gallery: 'MODELE',
  filmographie: 'FILMOGRAPHIE', composition: 'COMPOSITION', scores: 'SCORES', booking: 'BOOKING',
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

// Overlay shader de transition (lazy) — fallback silencieux si WebGL absent.
let playFx: ((c: [number, number, number], fwd: boolean) => void) | null = null;

function idFromPath(pathname: string): string {
  const file = (pathname.split('/').pop() || '').toLowerCase();
  if (!file || file === 'index') return 'home';
  if (file.includes('music') || file.includes('violon')) return 'music';
  if (file.includes('composition')) return 'composition';
  if (file.includes('parcours')) return 'parcours';
  if (file.includes('filmographie')) return 'filmographie';
  if (file.includes('projects')) return 'scores';
  if (file.includes('gallery') || file.includes('modele')) return 'gallery';
  if (file.includes('contact')) return 'booking';
  return 'home';
}

let forward = true; // sens de navigation (par ordre de page)

function runBand(id: string) {
  const band = document.querySelector<HTMLElement>('.transition-band');
  if (!band) return;
  band.style.setProperty('--band-accent', ACCENTS[id] || ACCENTS.home);
  const span = band.querySelector('span');
  if (span) span.textContent = LABELS[id] || '';
  // WAAPI uniquement (pas de classe .is-active : on evite la double-animation CSS).
  // Mouvement en 3 temps : entre en decelerant -> PALIER au centre (stop smooth, on lit le label)
  // -> repart en accelerant. Les easings par-keyframe creent le "stop puis repart".
  band.animate(
    [
      { transform: 'translate3d(120%, 0, 0)', easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)' }, // arrive, decelere
      { transform: 'translate3d(0, 0, 0)', offset: 0.34, easing: 'linear' },                  // centre
      { transform: 'translate3d(0, 0, 0)', offset: 0.48, easing: 'cubic-bezier(0.76, 0, 0.3, 1)' }, // PALIER court puis repart (plus tot)
      { transform: 'translate3d(-120%, 0, 0)' },
    ],
    { duration: 1550, fill: 'both' },
  );
}

function animatePageIn() {
  const page = document.querySelector<HTMLElement>('#app .page');
  if (!page) return;
  const fromClip = forward ? 'inset(0 0 0 24%)' : 'inset(0 24% 0 0)';
  const fromX = forward ? '14%' : '-14%';
  // Glisse CONTINU (pas de palier) : seuls la bande + le shader marquent le stop.
  page.animate(
    [
      { transform: `translate3d(${fromX}, 0, 0) scale(0.985)`, opacity: 0.01, clipPath: fromClip },
      { opacity: 1, offset: 0.6 },
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, clipPath: 'inset(0 0 0 0)' },
    ],
    { duration: 1720, easing: 'cubic-bezier(0.33, 1, 0.45, 1)', fill: 'both' },
  );

  // Reveal differe du gros titre (clip bas) + portrait — via translate (compose avec transform).
  const title = page.querySelector<HTMLElement>('.title-wrap');
  if (title) {
    title.animate(
      [
        { translate: '6vw 0', opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { translate: '0 0', opacity: 0.92, clipPath: 'inset(0 0 0 0)' },
      ],
      { duration: 1360, delay: 120, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
    );
  }
  const person = page.querySelector<HTMLElement>('.hero-person');
  if (person) {
    person.animate(
      [
        { translate: '5vw 0', opacity: 0.52 },
        { translate: '0 0', opacity: 1 },
      ],
      { duration: 1440, delay: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
    );
  }
}

let bound = false;

export function initTransitions() {
  if (bound) return;
  bound = true;

  // Charge l'overlay shader (lazy). Si WebGL echoue, playFx reste null -> wipe seul.
  // Sur PC faible (perf.low) on ne charge PAS le shader : le wipe WAAPI suffit.
  const fxCanvas = document.querySelector<HTMLCanvasElement>('#transition-gl');
  if (fxCanvas) {
    perf.whenReady(() => {
      if (perf.low) return;
      import('./webgl/transition-fx')
        .then((m) => { playFx = m.initTransitionFx(fxCanvas); })
        .catch((e) => console.warn('[fx] chargement WebGL echoue', e));
    });
  }

  // Sens de navigation = ordre de page (rail/molette/cover-hit sont tous "push" historique).
  document.addEventListener('astro:before-preparation', (event) => {
    const e = event as unknown as { from?: URL; to?: URL };
    const fi = ORDER.indexOf(idFromPath(e.from?.pathname || window.location.pathname));
    const ti = ORDER.indexOf(idFromPath(e.to?.pathname || window.location.pathname));
    forward = ti >= fi;
  });

  // Bande au moment ou la nouvelle page se prepare a entrer.
  document.addEventListener('astro:before-swap', (event) => {
    const e = event as unknown as { to?: URL };
    const id = idFromPath(e.to?.pathname || window.location.pathname);
    document.body.classList.add('is-transitioning');
    runBand(id);
    if (playFx) playFx(hexToRgb(ACCENTS[id] || ACCENTS.home), forward);
  });

  // Nouvelle page en DOM -> on l'anime (WAAPI, insensible a reduced-motion).
  document.addEventListener('astro:after-swap', () => {
    animatePageIn();
  });

  document.addEventListener('astro:page-load', () => {
    document.body.classList.remove('is-transitioning');
  });
}
