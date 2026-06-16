import { useContentDoc } from '../content';
import { SaveBar, Field, ChipsEditor, RowHead, move } from '../components/editor-bits';
import type { Session, AvailabilityDate } from '../types';

export default function Music() {
  const { data, update, save, loading, saving, dirty } = useContentDoc('music');
  if (loading || !data) return <div className="spinner-page">Chargement…</div>;

  const setSessions = (sessions: Session[]) => update({ ...data, sessions });
  const setDates = (dates: AvailabilityDate[]) => update({ ...data, dates });
  const patchSession = (i: number, p: Partial<Session>) =>
    setSessions(data.sessions.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const patchDate = (i: number, p: Partial<AvailabilityDate>) =>
    setDates(data.dates.map((d, j) => (j === i ? { ...d, ...p } : d)));

  return (
    <>
      <SaveBar title="Violon — contenu" dirty={dirty} saving={saving} onSave={save} />
      <div className="content">
        <div className="panel">
          <p className="panel-title">Live sessions</p>
          {data.sessions.map((s, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={s.n || i + 1}
                onUp={() => setSessions(move(data.sessions, i, i - 1))}
                onDown={() => setSessions(move(data.sessions, i, i + 1))}
                onRemove={() => setSessions(data.sessions.filter((_, j) => j !== i))}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <input type="checkbox" checked={!!s.active}
                    onChange={(e) => patchSession(i, { active: e.target.checked })} /> mise en avant
                </label>
              </RowHead>
              <div className="row">
                <Field label="N°" value={s.n} onChange={(v) => patchSession(i, { n: v })} />
                <Field label="Durée" value={s.d} onChange={(v) => patchSession(i, { d: v })} />
              </div>
              <Field label="Titre" value={s.t} onChange={(v) => patchSession(i, { t: v })} />
              <div className="row">
                <Field label="Sous-titre" value={s.sub} onChange={(v) => patchSession(i, { sub: v })} />
                <Field label="Catégorie" value={s.cat} onChange={(v) => patchSession(i, { cat: v })} />
              </div>
              <Field label="Image (chemin /assets/… ou URL)" value={s.img} onChange={(v) => patchSession(i, { img: v })} />
            </div>
          ))}
          <button className="btn" onClick={() => setSessions([...data.sessions,
            { n: String(data.sessions.length + 1).padStart(2, '0'), t: '', sub: '', cat: '', d: '', img: '' }])}>
            + Ajouter une session
          </button>
        </div>

        <div className="panel">
          <p className="panel-title">Répertoire / moods</p>
          <ChipsEditor values={data.moods} onChange={(moods) => update({ ...data, moods })} />
        </div>

        <div className="panel">
          <p className="panel-title">Disponibilités</p>
          {data.dates.map((d, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={i + 1}
                onUp={() => setDates(move(data.dates, i, i - 1))}
                onDown={() => setDates(move(data.dates, i, i + 1))}
                onRemove={() => setDates(data.dates.filter((_, j) => j !== i))} />
              <div className="row">
                <Field label="Date" value={d.day} onChange={(v) => patchDate(i, { day: v })} />
                <Field label="Lieu" value={d.loc} onChange={(v) => patchDate(i, { loc: v })} />
              </div>
              <Field label="Intitulé" value={d.t} onChange={(v) => patchDate(i, { t: v })} />
            </div>
          ))}
          <button className="btn" onClick={() => setDates([...data.dates, { day: '', t: '', loc: '' }])}>
            + Ajouter une date
          </button>
        </div>
      </div>
    </>
  );
}
