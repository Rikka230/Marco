// Detection "PC faible" -> mode perf (coupe les effets lourds GPU/CPU).
// Pose document.documentElement.dataset.perf = 'low' :
//  - le CSS (html[data-perf="low"]) coupe backdrop-filter / animations / grain ;
//  - le JS (main.ts, dotwave.ts) coupe les boucles WebGL/canvas du visualizer.
// Detection en 2 temps : indices statiques rapides + sonde FPS reelle (~1.1s).

let ready = false;
let low = false;
const queue: Array<() => void> = [];

function remember(decision: 'low' | 'ok') {
  try {
    sessionStorage.setItem('marco-perf', decision);
  } catch {
    /* sessionStorage indispo (mode prive strict) : on ignore. */
  }
}

function setLow() {
  if (low) return;
  low = true;
  document.documentElement.dataset.perf = 'low';
  remember('low');
}

function markReady() {
  if (ready) return;
  ready = true;
  const cbs = queue.splice(0);
  cbs.forEach((cb) => cb());
}

// Si l'inline head (ou un run precedent) a deja decide, on se synchronise.
if (document.documentElement.dataset.perf === 'low') low = true;

// Decision deja prise dans cette session (F5) : on la REUTILISE telle quelle au lieu
// de re-sonder. Evite le scintillement "effets pleins -> coupes a 1.8s" a chaque F5
// et garantit un rendu identique entre rechargements et navigation SPA.
let cached: string | null = null;
try {
  cached = sessionStorage.getItem('marco-perf');
} catch {
  /* sessionStorage indispo : on sondera normalement. */
}
if (cached === 'low') {
  setLow();
  markReady();
}
if (cached === 'ok') {
  // Machine deja jugee capable : effets complets, pas de sonde.
  markReady();
}

const alreadyDecided = cached === 'low' || cached === 'ok';

// 1) Indices statiques : peu de coeurs logiques ou peu de RAM => probablement faible.
const cores = navigator.hardwareConcurrency || 8;
const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;
if (!alreadyDecided && (cores <= 4 || mem <= 4)) setLow();

// 2) Sonde FPS : mesure le framerate REEL (effets actifs) ~1.1s. Un GPU faible
//    (que les indices statiques ratent) fait chuter le FPS -> mode perf.
let frames = 0;
let t0 = 0;
function probe(t: number) {
  if (t0 === 0) t0 = t;
  frames++;
  const dt = t - t0;
  if (dt < 1000) {
    requestAnimationFrame(probe);
    return;
  }
  const fps = frames / (dt / 1000);
  // Seuil prudent : seuls les GPU reellement lents (FPS bas en regime stable)
  // basculent en mode perf. 32 (au lieu de 38) reduit les faux positifs sur
  // machines capables ou le chargement a froid de parcours fait plonger le FPS.
  if (fps < 32) setLow();
  else remember('ok');
  console.info(`[perf] ~${Math.round(fps)} fps -> ${low ? 'MODE PERF (effets alleges)' : 'OK (effets complets)'}`);
  markReady();
}
// On laisse la page se stabiliser (~1400ms) AVANT de mesurer : mesurer pendant le
// chargement a froid (decode image, init WebGL, compile shaders) donnait des FPS
// bas trompeurs. On ne sonde pas si la session a deja tranche.
if (!alreadyDecided) setTimeout(() => requestAnimationFrame(probe), 1400);
// Filet : si l'onglet demarre en arriere-plan (rAF gele), on debloque a 3.5s.
setTimeout(markReady, 3500);

export const perf = {
  get low() {
    return low;
  },
  /** Execute cb une fois la detection terminee (ou tout de suite si deja prete). */
  whenReady(cb: () => void) {
    if (ready) cb();
    else queue.push(cb);
  },
};
