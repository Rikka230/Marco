// Couche de profondeur WebGL (OGL) pour la page Modele : les visuels flottent sur
// des plans a profondeurs differentes, avec parallaxe au pointeur. Couche ambiante
// DERRIERE les strips (qui gardent autoscroll + lightbox). Auto-contenu, nettoye a
// la sortie (pas de fuite GPU). Fallback : si init echoue, la page reste inchangee.

import { Renderer, Camera, Transform, Program, Mesh, Plane, Texture } from 'ogl';

const IMAGES = [
  '/assets/img/cover-1.webp', '/assets/img/cover-2.webp', '/assets/img/cover-3.webp',
  '/assets/img/cover-4.webp', '/assets/img/cover-5.webp', '/assets/img/cover-6.webp',
];

// Disposition (x, y, z, echelle) — z negatif = plus loin.
const LAYOUT = [
  [-1.7, 0.5, -2.4, 1.5], [1.6, 0.9, -1.6, 1.2], [-1.1, -0.8, -0.8, 1.1],
  [1.9, -0.6, -2.0, 1.35], [0.2, 1.1, -3.0, 1.7], [0.7, -1.2, -1.1, 1.0],
];

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform sampler2D tMap;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec3 col = texture2D(tMap, vUv).rgb;
    // Fondu doux des bords (cadre flottant).
    vec2 d = smoothstep(0.0, 0.12, vUv) * smoothstep(0.0, 0.12, 1.0 - vUv);
    float edge = d.x * d.y;
    gl_FragColor = vec4(col, uOpacity * edge);
  }
`;

export function initGalleryDepth(canvas: HTMLCanvasElement): () => void {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, antialias: true, dpr: Math.min(2, window.devicePixelRatio || 1) });
  } catch (e) {
    console.warn('[gallery] WebGL indisponible', e);
    return () => {};
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 38 });
  camera.position.z = 5;
  const scene = new Transform();

  const meshes: { mesh: Mesh; base: number[]; phase: number }[] = [];
  const geometry = new Plane(gl);

  IMAGES.forEach((src, i) => {
    const texture = new Texture(gl, { generateMipmaps: false });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => { texture.image = img; };
    const program = new Program(gl, {
      vertex, fragment, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { tMap: { value: texture }, uOpacity: { value: 0.5 } },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const [x, y, z, s] = LAYOUT[i % LAYOUT.length];
    mesh.position.set(x, y, z);
    mesh.scale.set(s * 1.4, s, 1);
    mesh.setParent(scene);
    meshes.push({ mesh, base: [x, y, z], phase: i * 1.7 });
  });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.tx = (e.clientX / window.innerWidth) - 0.5;
    mouse.ty = (e.clientY / window.innerHeight) - 0.5;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.perspective({ aspect: w / h });
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  let raf = 0;
  let t = 0;
  let alive = true;
  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    t += 0.01;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    for (const item of meshes) {
      const [bx, by, bz] = item.base;
      const depth = (bz + 3.2) * 0.5; // plus pres = plus de parallaxe
      item.mesh.position.x = bx + mouse.x * (0.6 + depth) ;
      item.mesh.position.y = by - mouse.y * (0.5 + depth) + Math.sin(t + item.phase) * 0.06;
      item.mesh.rotation.z = mouse.x * 0.04;
    }
    renderer.render({ scene, camera });
  }
  frame();

  // Cleanup a la sortie de la page (annule RAF + perd le contexte GPU).
  return () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', resize);
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  };
}
