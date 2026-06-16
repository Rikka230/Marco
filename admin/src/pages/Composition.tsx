import { useContentDoc } from '../content';
import { SaveBar, Field, ChipsEditor, RowHead, move } from '../components/editor-bits';
import type { Track } from '../types';

export default function Composition() {
  const { data, update, save, loading, saving, dirty } = useContentDoc('composition');
  if (loading || !data) return <div className="spinner-page">Chargement…</div>;

  const setTracks = (tracks: Track[]) => update({ tracks });
  const patch = (i: number, p: Partial<Track>) =>
    setTracks(data.tracks.map((t, j) => (j === i ? { ...t, ...p } : t)));

  return (
    <>
      <SaveBar title="Composition — pistes" dirty={dirty} saving={saving} onSave={save} />
      <div className="content">
        <div className="panel">
          <p className="panel-title">{data.tracks.length} pistes</p>
          {data.tracks.map((t, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={t.n || i + 1}
                onUp={() => setTracks(move(data.tracks, i, i - 1))}
                onDown={() => setTracks(move(data.tracks, i, i + 1))}
                onRemove={() => setTracks(data.tracks.filter((_, j) => j !== i))}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <input type="checkbox" checked={!!t.active}
                    onChange={(e) => patch(i, { active: e.target.checked })} /> active
                </label>
              </RowHead>
              <div className="row">
                <Field label="N°" value={t.n} onChange={(v) => patch(i, { n: v })} />
                <Field label="Titre" value={t.title} onChange={(v) => patch(i, { title: v })} />
              </div>
              <div className="field">
                <label>Métadonnées (genre, année, durée, tag…)</label>
                <ChipsEditor values={t.meta} onChange={(meta) => patch(i, { meta })} />
              </div>
            </div>
          ))}
          <button className="btn" onClick={() => setTracks([...data.tracks,
            { n: String(data.tracks.length + 1).padStart(2, '0'), title: '', meta: [] }])}>
            + Ajouter une piste
          </button>
        </div>
      </div>
    </>
  );
}
