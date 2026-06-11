// Navigation globale — port des IIFE "CHAPTER NAV" + "GLOBAL NAVIGATION v0.3".
// Sous Astro : le rail (ChapterNav.astro) est persiste ; la navigation passe par
// navigate() de ClientRouter au lieu du goTo() PJAX. L'accent est gere en CSS pur
// (body[data-marco-page] -> --marco-nav-accent), donc syncNav ne touche que l'etat actif.

import { navigate } from 'astro:transitions/client';

interface Chapter { id: string; short: string; label: string; href: string; }

const CHAPTERS: Chapter[] = [
  { id: 'home', short: 'HOME', label: 'HOME', href: '/' },
  { id: 'music', short: 'VIOLON', label: 'VIOLON', href: '/music' },
  { id: 'parcours', short: 'PARCOURS', label: 'PARCOURS', href: '/parcours' },
  { id: 'gallery', short: 'MODELE', label: 'MODELE', href: '/gallery' },
  { id: 'filmographie', short: 'FILMO', label: 'FILMOGRAPHIE', href: '/filmographie' },
  { id: 'composition', short: 'COMPO', label: 'COMPOSITION', href: '/composition' },
  { id: 'booking', short: 'CONTACT', label: 'CONTACT', href: '/contact' },
];

const WHEEL_LOCK_MS = 620;
const WHEEL_THRESHOLD = 64;

function detectId(): string {
  const id = document.body.dataset.marcoPage || 'home';
  return CHAPTERS.some((c) => c.id === id) ? id : 'home';
}

const getNav = () => document.querySelector<HTMLElement>('[data-chapter-nav]');

function closeNav() {
  const nav = getNav();
  if (!nav) return;
  nav.classList.remove('is-open');
  nav.querySelector('.chapter-toggle')?.setAttribute('aria-expanded', 'false');
}

/** Met a jour l'etat actif du rail persiste (num, label, dots, liens). */
export function syncNav(forcedId?: string) {
  const nav = getNav();
  if (!nav) return;
  const activeId = forcedId || detectId();
  const activeIndex = Math.max(0, CHAPTERS.findIndex((c) => c.id === activeId));
  const active = CHAPTERS[activeIndex] || CHAPTERS[0];

  nav.dataset.activePage = active.id;
  const num = nav.querySelector('.chapter-num');
  const current = nav.querySelector('.chapter-current');
  if (num) num.textContent = String(activeIndex + 1).padStart(2, '0');
  if (current) current.textContent = active.short;

  nav.querySelectorAll('.chapter-dots i').forEach((dot, index) => {
    dot.classList.toggle('is-active', index === activeIndex);
  });
  nav.querySelectorAll<HTMLAnchorElement>('.chapter-link').forEach((link) => {
    const on = link.dataset.chapterId === active.id;
    link.classList.toggle('is-active', on);
    if (on) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function goRelative(offset: number, wrap: boolean) {
  const activeId = detectId();
  const currentIndex = Math.max(0, CHAPTERS.findIndex((c) => c.id === activeId));
  const nextIndex = wrap
    ? (currentIndex + offset + CHAPTERS.length) % CHAPTERS.length
    : Math.min(CHAPTERS.length - 1, Math.max(0, currentIndex + offset));
  if (nextIndex === currentIndex) return;
  closeNav();
  document.body.classList.add('marco-page-wheel-locked');
  window.setTimeout(() => document.body.classList.remove('marco-page-wheel-locked'), 320);
  navigate(CHAPTERS[nextIndex].href);
}

function isInsideInternalScroller(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('input, textarea, select, option, button, [contenteditable="true"]') && !target.closest('[data-chapter-nav]')) return true;
  if (target.closest('.composition-track-scroll, .composition-diagonal-zone, .music-drawer-sheet, .music-drawer-list, [data-music-drawer], .contact-form, .contact-card, .contact-panel, [data-no-page-wheel]')) return true;

  let node: Element | null = target;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.closest && node.closest('[data-chapter-nav]')) return false;
    const style = window.getComputedStyle(node);
    const canScrollY = /(auto|scroll)/.test(style.overflowY);
    const hasRealScroll = node.scrollHeight > node.clientHeight + 6;
    if (canScrollY && hasRealScroll) return true;
    node = node.parentElement;
  }
  return false;
}

let bound = false;
let wheelLocked = false;
let wheelBuffer = 0;
let wheelFallback = 0;

/** Attache les listeners de navigation une seule fois (document persiste). */
export function initNav() {
  if (bound) return;
  bound = true;

  // Ouverture du panneau au SURVOL (intention) + delai de fermeture quand on quitte,
  // pour laisser le temps de lire la liste. Le rail est persiste (transition:persist),
  // donc on attache les listeners une seule fois sur le noeud conserve.
  let hoverCloseTimer = 0;
  const openNav = () => {
    const nav = getNav();
    if (!nav) return;
    window.clearTimeout(hoverCloseTimer);
    nav.classList.add('is-open');
    nav.querySelector('.chapter-toggle')?.setAttribute('aria-expanded', 'true');
  };
  const navEl = getNav();
  if (navEl) {
    navEl.addEventListener('mouseenter', openNav);
    navEl.addEventListener('mouseleave', () => {
      window.clearTimeout(hoverCloseTimer);
      hoverCloseTimer = window.setTimeout(closeNav, 850);
    });
  }

  // Rail : toggle ouverture, prev/next (avec wrap), clic exterieur, Escape. (Delegue sur document.)
  document.addEventListener('click', (event) => {
    const target = event.target as Element;

    const toggle = target.closest('[data-chapter-nav] .chapter-toggle');
    if (toggle) {
      event.stopPropagation();
      // Ouvre (le survol gere l'ouverture sur desktop ; le clic/tap couvre le tactile).
      // Fermeture : en quittant le rail (desktop) ou par un clic exterieur (existant ci-dessous).
      openNav();
      return;
    }

    const prev = target.closest('[data-chapter-step="prev"]');
    if (prev) { event.preventDefault(); event.stopPropagation(); goRelative(-1, true); return; }
    const next = target.closest('[data-chapter-step="next"]');
    if (next) { event.preventDefault(); event.stopPropagation(); goRelative(1, true); return; }

    // Clic sur un lien du rail : fermer le panneau (ClientRouter gere la navigation).
    if (target.closest('[data-chapter-nav] .chapter-link')) { closeNav(); return; }

    // Clic exterieur au rail : fermer.
    const nav = getNav();
    if (nav && !nav.contains(target)) closeNav();
  });

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeNav(); });

  // Molette = navigation page a page (clamp, sans wrap).
  document.addEventListener('wheel', (event) => {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    // Panneau ouvert : on laisse lire/parcourir la liste sans naviguer (sinon il se referme aussitot).
    if (getNav()?.classList.contains('is-open')) return;
    const target = event.target;
    const onRail = target instanceof Element && Boolean(target.closest('[data-chapter-nav]'));
    if (!onRail && isInsideInternalScroller(target)) return;

    if (wheelLocked) { event.preventDefault(); return; }
    wheelBuffer += event.deltaY;
    if (Math.abs(wheelBuffer) < WHEEL_THRESHOLD) { event.preventDefault(); return; }

    const direction = wheelBuffer > 0 ? 1 : -1;
    wheelBuffer = 0;
    wheelLocked = true;
    event.preventDefault();
    goRelative(direction, false);

    window.clearTimeout(wheelFallback);
    wheelFallback = window.setTimeout(() => { wheelLocked = false; wheelBuffer = 0; }, 1600);
  }, { passive: false });

  // Fin de navigation Astro : debloque la molette.
  document.addEventListener('astro:page-load', () => {
    window.clearTimeout(wheelFallback);
    wheelLocked = false;
    wheelBuffer = 0;
  });
}

// Reference pour l'eventuel reglage fin de la cadence molette (parite avec l'ancien lock).
void WHEEL_LOCK_MS;
