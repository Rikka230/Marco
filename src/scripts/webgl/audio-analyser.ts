// AnalyserNode singleton branche sur #audioLoop (persiste).
// createMediaElementSource ne peut etre appele qu'UNE fois par element -> singleton.
// On le cree au premier 'play' (geste utilisateur) pour pouvoir resume() le contexte.

interface AnalyserBundle {
  analyser: AnalyserNode;
  data: Uint8Array;
}

let bundle: AnalyserBundle | null = null;
let ctx: AudioContext | null = null;
let tried = false;

export function ensureAnalyser(): AnalyserBundle | null {
  if (bundle) return bundle;
  if (tried) return null;
  tried = true;
  const audio = document.querySelector<HTMLAudioElement>('#audioLoop');
  if (!audio) { tried = false; return null; }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination); // sinon l'audio serait coupe
    bundle = { analyser, data: new Uint8Array(analyser.frequencyBinCount) };
  } catch (e) {
    console.warn('[viz] AnalyserNode indisponible', e);
    bundle = null;
  }
  return bundle;
}

export function resumeAudioCtx() {
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}
