/* === Shim de cycle de vie Marco -> Astro ===
   Fournit window.Marco.registerPage(id, {enter, cleanup}) attendu par les modules de page
   historiques (assets/js/*.js), et le pilote via les events Astro :
   - astro:page-load   -> enter(pageEl, { signal })  pour la page entrante
   - astro:before-swap -> cleanup + abort(signal)    pour la/les page(s) sortante(s)
   Permet de reutiliser model-page.js / filmographie-page.js / parcours-page.js SANS modification. */

const registry = {};   // id -> { enter, cleanup }
const entered = {};    // id -> { controller, el }

function findPageEl(id) {
  return document.querySelector(`#app .page[data-page="${id}"]`);
}

function enter(id) {
  const handlers = registry[id];
  if (!handlers || entered[id]) return;
  const el = findPageEl(id);
  if (!el) return;
  const controller = new AbortController();
  entered[id] = { controller, el };
  try {
    handlers.enter?.(el, { signal: controller.signal, pageId: id, isHardLoad: false });
  } catch (e) {
    console.error('[Marco shim] enter', id, e);
  }
}

function leaveAll() {
  for (const id of Object.keys(entered)) {
    const handlers = registry[id];
    const rec = entered[id];
    try {
      handlers?.cleanup?.(rec.el, { signal: rec.controller.signal, pageId: id });
    } catch (e) {
      console.error('[Marco shim] cleanup', id, e);
    }
    rec.controller.abort();
    delete entered[id];
  }
}

const Marco = (window.Marco = window.Marco || {});
Marco.registerPage = function registerPage(id, handlers) {
  registry[id] = handlers;
  enter(id); // rattrapage si la page est deja dans le DOM au moment de l'enregistrement
};

document.addEventListener('astro:page-load', () => {
  for (const id of Object.keys(registry)) enter(id);
});
document.addEventListener('astro:before-swap', leaveAll);
