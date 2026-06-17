// Detection "PC faible" -> mode perf (coupe les effets lourds GPU/CPU).
// Pose document.documentElement.dataset.perf = 'low' :
//  - le CSS (html[data-perf="low"]) coupe backdrop-filter / animations / grain ;
//  - le JS (main.ts, dotwave.ts) coupe les boucles WebGL/canvas du visualizer.
// Detection en 2 temps : indices statiques rapides + sonde FPS reelle (~1.1s).

let ready = false;
let low = false;
const queue: Array<() => void> = [];

function setLow() {
  if (low) return;
  low = true;
  document.documentElement.dataset.perf = 'low';
}

function markReady() {
  if (ready) return;
  ready = true;
  const cbs = queue.splice(0);
  cbs.forEach((cb) => cb());
}

// Si l'inline head (ou un run precedent) a deja decide, on se synchronise.
if (document.documentElement.dataset.perf === 'low') low = true;

// 1) Indices statiques : peu de coeurs logiques ou peu de RAM => probablement faible.
const cores = navigator.hardwareConcurrency || 8;
const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;
if (cores <= 4 || mem <= 4) setLow();

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
  // basculent en mode perf. Evite les faux positifs sur machines capables.
  if (fps < 38) setLow();
  console.info(`[perf] ~${Math.round(fps)} fps -> ${low ? 'MODE PERF (effets alleges)' : 'OK (effets complets)'}`);
  markReady();
}
// On laisse la page se stabiliser (~800ms) AVANT de mesurer : mesurer pendant le
// chargement a froid (decode image, init WebGL) donnait des FPS bas trompeurs.
setTimeout(() => requestAnimationFrame(probe), 800);
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
