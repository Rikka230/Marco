// Orchestrateur client du site Marco sous Astro.
// Remplace l'enchainement DOMContentLoaded + Marco.lifecycle du PJAX par l'event
// `astro:page-load` (emis au chargement initial ET apres chaque navigation ClientRouter).
// Les init* sont idempotents (listeners delegues sur document, attaches une seule fois).

import { perf } from './perf';
import { initAudio, restoreTrack } from './audio';
import { initDotWave } from './dotwave';
import { initNav, syncNav } from './nav';
import { initTransitions } from './transitions';
// Modules de page historiques reutilises VERBATIM via le shim de cycle de vie.
// Le shim doit etre importe AVANT (il definit window.Marco.registerPage).
import './pages/lifecycle-shim.js';
import '../../assets/js/model-page.js';
import '../../assets/js/filmographie-page.js';
import '../../assets/js/parcours-page.js';

/* === Parallax pointeur (port du CORE) === */
let parallaxBound = false;
const parallax = { x: 0, y: 0, frame: 0 as number };

function applyParallax() {
  parallax.frame = 0;
  if (document.body.classList.contains('is-transitioning')) return;
  const page = document.querySelector<HTMLElement>('#app .page:not(.is-leaving)') || document.querySelector<HTMLElement>('#app .page');
  if (!page) return;
  const title = page.querySelector<HTMLElement>('.title-wrap');
  const person = page.querySelector<HTMLElement>('.hero-person');
  const bg = page.querySelector<HTMLElement>('.photo-bg');
  const { x, y } = parallax;
  const isHome = page.dataset.page === 'home';
  if (title) { title.style.setProperty('--title-x', `${x * (isHome ? -11 : -10)}px`); title.style.setProperty('--title-y', `${y * (isHome ? 5 : 4)}px`); }
  if (person) { person.style.setProperty('--person-x', `${x * (isHome ? 8 : 7)}px`); person.style.setProperty('--person-y', `${y * (isHome ? 3 : 2.5)}px`); }
  if (bg) { bg.style.setProperty('--bg-x', `${x * (isHome ? -5 : -3)}px`); bg.style.setProperty('--bg-y', `${y * (isHome ? -2 : -1.5)}px`); }
}

function scheduleParallax(x = 0, y = 0) {
  parallax.x = x;
  parallax.y = y;
  if (parallax.frame !== 0 || document.body.classList.contains('is-transitioning')) return;
  parallax.frame = requestAnimationFrame(applyParallax);
}

function initParallax() {
  if (parallaxBound) return;
  parallaxBound = true;
  window.addEventListener('pointermove', (e) => {
    scheduleParallax(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
  }, { passive: true });
  window.addEventListener('pointerleave', () => scheduleParallax(), { passive: true });
}

/* === Formulaire contact (front-only, port du CORE) === */
let formsBound = false;
function initForms() {
  if (formsBound) return;
  formsBound = true;

  document.addEventListener('submit', (e) => {
    const form = (e.target as Element).closest<HTMLFormElement>('[data-contact-form]');
    if (!form) return;
    e.preventDefault();
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('.contact-submit');
    form.classList.add('is-ready');
    if (status) status.textContent = 'MESSAGE READY - CONNECT BACKEND';
    if (submit) {
      submit.textContent = 'REQUEST READY';
      window.setTimeout(() => { if (submit.isConnected) submit.textContent = 'SEND REQUEST'; }, 1800);
    }
  });

  const clearReady = (e: Event) => {
    const form = (e.target as Element).closest('[data-contact-form]');
    if (!form || !form.classList.contains('is-ready')) return;
    form.classList.remove('is-ready');
    const status = form.querySelector('[data-form-status]');
    if (status) status.textContent = '';
  };
  document.addEventListener('input', clearReady);
  document.addEventListener('change', clearReady);
}

/* === Entree "rolling reveal" des listes (Phase 2, port) === */
function applyListEntrance() {
  const page = document.querySelector<HTMLElement>('#app .page:not(.is-leaving)') || document.querySelector<HTMLElement>('#app .page');
  if (!page) return;
  const items = page.querySelectorAll<HTMLElement>(
    '.composition-track, .filmographie-row, .parcours-timeline-point, .parcours-mobile-timeline-card, .model-frame:not([data-clone="true"])'
  );
  items.forEach((el, i) => {
    el.style.setProperty('--enter-i', String(Math.min(i, 16)));
    el.classList.remove('marco-enter-list');
    void el.offsetWidth;
    el.classList.add('marco-enter-list');
  });
}

/* === Visualizer WebGL (lazy) : remplace dotWave si WebGL dispo, sinon fallback 2D === */
let glTried = false;
function tryInitVisualizer() {
  if (glTried) return;
  glTried = true;
  // On attend la decision perf : sur PC faible on NE lance PAS le visualizer WebGL
  // (le dotWave 2D est aussi stoppe par data-perf="low" dans dotwave.ts).
  perf.whenReady(() => {
    if (perf.low) return;
    const canvas = document.querySelector<HTMLCanvasElement>('#dotwave-gl');
    if (!canvas) return;
    const start = () => import('./webgl/audio-visualizer')
      .then((m) => m.initVisualizer(canvas))
      .catch((e) => console.warn('[viz] chargement WebGL echoue (fallback 2D)', e));
    if ('requestIdleCallback' in window) (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(start);
    else window.setTimeout(start, 200);
  });
}

/* === Profondeur WebGL de la page Modele (lazy, nettoyee a la sortie) === */
let galleryCleanup: (() => void) | null = null;
let gallerySwapBound = false;
function tryInitGalleryDepth() {
  if (!gallerySwapBound) {
    gallerySwapBound = true;
    document.addEventListener('astro:before-swap', () => {
      if (galleryCleanup) { galleryCleanup(); galleryCleanup = null; }
    });
  }
  if (galleryCleanup) return; // deja actif
  if (!document.querySelector('.model-page')) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#gallery-gl');
  if (!canvas) return;
  // Profondeur WebGL = lourde : on la saute sur PC faible.
  perf.whenReady(() => {
    if (perf.low || galleryCleanup || !document.querySelector('.model-page')) return;
    import('./webgl/gallery-depth')
      .then((m) => { galleryCleanup = m.initGalleryDepth(canvas); })
      .catch((e) => console.warn('[gallery] WebGL echoue', e));
  });
}

/* === Cycle de vie Astro === */
function onPageLoad() {
  tryInitVisualizer();
  tryInitGalleryDepth();
  initAudio();
  initDotWave();
  initNav();
  initTransitions();
  initParallax();
  initForms();
  restoreTrack();
  syncNav();
  applyListEntrance();
}

document.addEventListener('astro:page-load', onPageLoad);
