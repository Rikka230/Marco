// Overlay shader de transition (OGL) : une vague d'energie couleur-accent + bruit
// balaie l'ecran pendant le wipe de page. Abstrait (ne capture pas les pixels de la
// page) -> robuste. Rendu UNIQUEMENT pendant la transition (aucun GPU au repos).
// Fallback : si WebGL echoue, initTransitionFx renvoie null et le wipe WAAPI suffit.

import { Renderer, Geometry, Program, Mesh } from 'ogl';

const DURATION = 820; // ms, ~ duree du wipe

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform float uProgress;
  uniform float uTime;
  uniform float uDir;       // 0 = avant, 1 = arriere
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    float x = mix(vUv.x, 1.0 - vUv.x, step(0.5, uDir));
    float coord = x * 0.82 + vUv.y * 0.18;          // balayage legerement diagonal
    float center = mix(-0.35, 1.35, uProgress);
    float band = smoothstep(0.34, 0.0, abs(coord - center));
    float n = noise(vUv * vec2(6.0, 9.0) + uTime * 0.6);
    float energy = band * (0.5 + 0.65 * n);
    float alpha = clamp(energy, 0.0, 1.0) * 0.6;
    gl_FragColor = vec4(uColor * (0.8 + 0.5 * n), alpha);
  }
`;

export type PlayFn = (color: [number, number, number], forward: boolean) => void;

export function initTransitionFx(canvas: HTMLCanvasElement): PlayFn | null {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, antialias: false, dpr: Math.min(1.5, window.devicePixelRatio || 1) });
  } catch (e) {
    console.warn('[fx] WebGL indisponible', e);
    return null;
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
  });
  const program = new Program(gl, {
    vertex, fragment, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uDir: { value: 0 },
      uColor: { value: [0.52, 0.96, 0.66] },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    // canvas dans le .stage (taille de reference) : dimensionner sur sa taille reelle.
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  let raf = 0;
  let start = 0;

  function clear() {
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function frame(now: number) {
    const p = Math.min(1, (now - start) / DURATION);
    program.uniforms.uProgress.value = p;
    program.uniforms.uTime.value = now * 0.001;
    renderer.render({ scene: mesh });
    if (p < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      clear(); // efface l'overlay a la fin (transparent au repos)
      raf = 0;
    }
  }

  return (color, forward) => {
    program.uniforms.uColor.value = color;
    program.uniforms.uDir.value = forward ? 0 : 1;
    start = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  };
}
