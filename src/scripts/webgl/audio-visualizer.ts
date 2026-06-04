// Visualizer audio WebGL (OGL) — remplace dotWave quand WebGL est dispo.
// Grille de points ; la hauteur de chaque colonne suit le spectre audio (AnalyserNode,
// echantillonne dans une texture de donnees). Couleur = --accent de la page active.
// Animation d'attente douce quand aucun son ne joue. Fallback : si init echoue,
// on renvoie false et le dotWave 2D reste actif. GLSL ES 1.00 (compatible WebGL1/2).

import { Renderer, Geometry, Program, Mesh, Texture } from 'ogl';
import { ensureAnalyser, resumeAudioCtx } from './audio-analyser';

const COLS = 80;
const ROWS = 9;

const vertex = /* glsl */ `
  attribute vec2 aGrid;          // x: colonne 0..1, y: rangee 0..1
  uniform sampler2D uFreq;       // spectre (largeur COLS)
  uniform float uPointSize;
  uniform float uSpan;
  varying float vAlpha;
  void main() {
    float f = texture2D(uFreq, vec2(aGrid.x, 0.5)).r;     // hauteur de colonne 0..1
    float lit = step(aGrid.y, f + 0.05);                  // point allume s'il est sous la hauteur
    float x = aGrid.x * 2.0 - 1.0;
    float y = -1.0 + aGrid.y * uSpan;                     // empile depuis le bas
    gl_Position = vec4(x, y, 0.0, 1.0);
    gl_PointSize = uPointSize * (0.55 + 0.9 * f);
    vAlpha = mix(0.05, 0.72, lit) * (0.45 + 0.55 * f);
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`;

let started = false;
let raf = 0;

function parseAccent(): [number, number, number] {
  const page = document.querySelector('#app .page:not(.is-leaving)') || document.querySelector('#app .page');
  const col = page ? getComputedStyle(page).getPropertyValue('--accent').trim() : '';
  const hex = col.replace('#', '');
  if (hex.length === 6) {
    return [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255];
  }
  const m = col.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255];
  return [0.52, 0.96, 0.66];
}

/** Tente d'initialiser le visualizer WebGL. Retourne true si OK, false sinon (fallback 2D). */
export function initVisualizer(canvas: HTMLCanvasElement): boolean {
  if (started) return true;
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, antialias: true, dpr: Math.min(2, window.devicePixelRatio || 1) });
  } catch (e) {
    console.warn('[viz] WebGL indisponible, fallback 2D', e);
    return false;
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  // Grille de points.
  const count = COLS * ROWS;
  const aGrid = new Float32Array(count * 2);
  let p = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      aGrid[p++] = COLS > 1 ? c / (COLS - 1) : 0;
      aGrid[p++] = ROWS > 1 ? r / (ROWS - 1) : 0;
    }
  }
  const geometry = new Geometry(gl, { aGrid: { size: 2, data: aGrid } });

  // Texture spectre (RGBA, largeur COLS).
  const texData = new Uint8Array(COLS * 4);
  const texture = new Texture(gl, {
    image: texData, width: COLS, height: 1,
    generateMipmaps: false, flipY: false,
    minFilter: gl.LINEAR, magFilter: gl.LINEAR,
  });

  const color = parseAccent();
  const program = new Program(gl, {
    vertex, fragment, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uFreq: { value: texture },
      uColor: { value: color },
      uPointSize: { value: 3 * (window.devicePixelRatio || 1) },
      uSpan: { value: 1.5 },
    },
  });
  const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || 88;
    renderer.setSize(w, h);
    program.uniforms.uPointSize.value = Math.max(2.2, Math.min(4.5, (w / 520))) * (window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const cols = new Float32Array(COLS); // hauteurs lissees
  let t = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const audio = document.querySelector<HTMLAudioElement>('#audioLoop');
    const playing = !!audio && !audio.paused;
    t += playing ? 0.05 : 0.018;

    const bundle = playing ? ensureAnalyser() : null;
    if (bundle) bundle.analyser.getByteFrequencyData(bundle.data);

    for (let c = 0; c < COLS; c++) {
      let target: number;
      if (bundle) {
        // Echantillonne le spectre (les basses dominent -> on etale en racine).
        const idx = Math.floor((c / COLS) * bundle.data.length * 0.7);
        target = (bundle.data[idx] / 255) ** 1.15;
      } else {
        // Animation d'attente : vague douce.
        const n = c / COLS;
        target = 0.12 + 0.1 * (Math.sin(n * 9.0 + t * 1.6) * 0.5 + 0.5) + 0.05 * Math.sin(n * 22.0 - t);
      }
      cols[c] += (target - cols[c]) * (playing ? 0.45 : 0.08);
      const v = Math.max(0, Math.min(1, cols[c]));
      texData[c * 4] = Math.round(v * 255);
    }
    texture.image = texData;
    texture.needsUpdate = true;

    renderer.render({ scene: mesh });
  }

  document.addEventListener('astro:page-load', () => {
    program.uniforms.uColor.value = parseAccent();
  });

  // Reprend le contexte audio des qu'on lance la lecture.
  document.addEventListener('play', (e) => {
    if ((e.target as HTMLElement)?.id === 'audioLoop') { ensureAnalyser(); resumeAudioCtx(); }
  }, true);

  started = true;
  document.documentElement.dataset.glViz = 'on';
  frame();
  return true;
}
