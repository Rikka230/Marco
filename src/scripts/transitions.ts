// Phase C — pilotage des transitions cinematiques (events ClientRouter).
// Le wipe directionnel est gere par la directive transition:animate sur <main>
// (BaseLayout). Ici on ajoute : la bande de transition (runBand du PJAX) au
// before-swap, body.is-transitioning pendant la transition, et l'entree differee
// titre + portrait sur la page entrante (astro:page-load).

const ACCENTS: Record<string, string> = {
  home: '#86f5a8', music: '#f4bd68', parcours: '#73aaf6', gallery: '#f08ac8',
  filmographie: '#f4bd68', composition: '#ff355d', scores: '#ff355d', booking: '#d8c3ff',
};

const LABELS: Record<string, string> = {
  home: 'MARCO', music: 'VIOLIN', parcours: 'PARCOURS', gallery: 'MODELE',
  filmographie: 'FILMOGRAPHIE', composition: 'COMPOSITION', scores: 'SCORES', booking: 'BOOKING',
};

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

function getBand(): HTMLElement | null {
  return document.querySelector('.transition-band');
}

function runBand(id: string) {
  const band = getBand();
  if (!band) return;
  band.style.setProperty('--band-accent', ACCENTS[id] || ACCENTS.home);
  const span = band.querySelector('span');
  if (span) span.textContent = LABELS[id] || '';
  band.classList.remove('is-active');
  void band.offsetWidth; // reflow pour rejouer l'animation
  band.classList.add('is-active');
}

function applyEntrance() {
  const page = document.querySelector<HTMLElement>('#app .page');
  if (!page) return;
  const replay = (el: Element | null, cls: string) => {
    if (!el) return;
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
  };
  replay(page.querySelector('.title-wrap'), 'marco-enter-title');
  replay(page.querySelector('.hero-person'), 'marco-enter-person');
}

let bound = false;

export function initTransitions() {
  if (bound) return;
  bound = true;

  // Bande + etat "en transition" au moment du swap.
  document.addEventListener('astro:before-swap', (event) => {
    const e = event as unknown as { to?: URL };
    document.body.classList.add('is-transitioning');
    runBand(idFromPath(e.to?.pathname || window.location.pathname));
  });

  // Fin de transition : retirer l'etat + jouer l'entree titre/portrait de la page entrante.
  document.addEventListener('astro:page-load', () => {
    document.body.classList.remove('is-transitioning');
    applyEntrance();
  });
}
