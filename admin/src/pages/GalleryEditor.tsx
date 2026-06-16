import { useContentDoc } from '../content';
import { SaveBar, Field, RowHead, move } from '../components/editor-bits';
import type { GalleryFrame, GalleryStrip } from '../types';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://marco-site-2f9aa.web.app';
// Les images /assets/... vivent sur le site public : on les resout pour l'apercu admin.
const resolveImg = (src: string) => (src.startsWith('/') ? SITE_URL + src : src);

export default function GalleryEditor() {
  const { data, update, save, loading, saving, dirty } = useContentDoc('gallery');
  if (loading || !data) return <div className="spinner-page">Chargement…</div>;

  const setStrip = (si: number, patch: Partial<GalleryStrip>) =>
    update({ strips: data.strips.map((s, i) => (i === si ? { ...s, ...patch } : s)) });
  const setFrames = (si: number, frames: GalleryFrame[]) => setStrip(si, { frames });
  const patchFrame = (si: number, fi: number, p: Partial<GalleryFrame>) =>
    setFrames(si, data.strips[si].frames.map((f, j) => (j === fi ? { ...f, ...p } : f)));

  return (
    <>
      <SaveBar title="Modèle — bandes photo" dirty={dirty} saving={saving} onSave={save} />
      <div className="content">
        {data.strips.map((strip, si) => (
          <div className="panel" key={strip.key}>
            <p className="panel-title">Bande {strip.num} · {strip.frames.length} photos</p>
            <div className="row">
              <Field label="Titre de la bande" value={strip.heading} onChange={(v) => setStrip(si, { heading: v })} />
              <Field label="Sous-titre" value={strip.sub} onChange={(v) => setStrip(si, { sub: v })} />
            </div>

            {strip.frames.map((f, fi) => (
              <div className="list-row" key={fi}>
                <RowHead idx={fi + 1}
                  onUp={() => setFrames(si, move(strip.frames, fi, fi - 1))}
                  onDown={() => setFrames(si, move(strip.frames, fi, fi + 1))}
                  onRemove={() => setFrames(si, strip.frames.filter((_, j) => j !== fi))}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={!!f.featured} onChange={(e) => patchFrame(si, fi, { featured: e.target.checked })} /> vedette
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={!!f.wide} onChange={(e) => patchFrame(si, fi, { wide: e.target.checked })} /> large
                  </label>
                </RowHead>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  {f.src && <img src={resolveImg(f.src)} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flex: 'none', border: '1px solid var(--line)' }} />}
                  <div style={{ flex: 1 }}>
                    <Field label="Image (URL ou /assets/…)" value={f.src} onChange={(v) => patchFrame(si, fi, { src: v })} />
                    <div className="row">
                      <Field label="Titre" value={f.title} onChange={(v) => patchFrame(si, fi, { title: v })} />
                      <Field label="Étiquette" value={f.label} onChange={(v) => patchFrame(si, fi, { label: v })} />
                    </div>
                    <Field label="Métadonnée (catégorie / style)" value={f.meta} onChange={(v) => patchFrame(si, fi, { meta: v })} />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn" onClick={() => setFrames(si, [...strip.frames,
              { id: `${strip.key}-${Date.now()}`, src: '', title: '', meta: '', label: '' }])}>
              + Ajouter une photo
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
