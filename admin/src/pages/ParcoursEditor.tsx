import { useContentDoc } from '../content';
import { SaveBar, Field, ChipsEditor, RowHead, move } from '../components/editor-bits';
import type { ParcoursStudy, ParcoursExperience, ParcoursTimelineItem } from '../types';

const ICONS = ['music', 'camera', 'clapper', 'stage', 'mic', 'violin', 'waveform', 'study'];
const TYPES = ['formation', 'job'];
const COLORS = ['blue', 'green', 'pink'];

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function ParcoursEditor() {
  const { data, update, save, loading, saving, dirty } = useContentDoc('parcours');
  if (loading || !data) return <div className="spinner-page">Chargement…</div>;

  const setStudies = (studies: ParcoursStudy[]) => update({ ...data, studies });
  const setExp = (experiences: ParcoursExperience[]) => update({ ...data, experiences });
  const setTl = (timeline: ParcoursTimelineItem[]) => update({ ...data, timeline });
  const patchStudy = (i: number, p: Partial<ParcoursStudy>) => setStudies(data.studies.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const patchExp = (i: number, p: Partial<ParcoursExperience>) => setExp(data.experiences.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const patchTl = (i: number, p: Partial<ParcoursTimelineItem>) => setTl(data.timeline.map((s, j) => (j === i ? { ...s, ...p } : s)));

  return (
    <>
      <SaveBar title="Parcours — contenu" dirty={dirty} saving={saving} onSave={save} />
      <div className="content">
        <div className="panel">
          <p className="panel-title">Formation / Études</p>
          {data.studies.map((s, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={i + 1}
                onUp={() => setStudies(move(data.studies, i, i - 1))}
                onDown={() => setStudies(move(data.studies, i, i + 1))}
                onRemove={() => setStudies(data.studies.filter((_, j) => j !== i))} />
              <div className="row">
                <Field label="Intitulé" value={s.title} onChange={(v) => patchStudy(i, { title: v })} />
                <Field label="Période" value={s.period} onChange={(v) => patchStudy(i, { period: v })} />
              </div>
              <Field label="Détail" value={s.detail} onChange={(v) => patchStudy(i, { detail: v })} />
            </div>
          ))}
          <button className="btn" onClick={() => setStudies([...data.studies, { title: '', detail: '', period: '' }])}>+ Ajouter une formation</button>
        </div>

        <div className="panel">
          <p className="panel-title">Expériences</p>
          {data.experiences.map((s, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={i + 1}
                onUp={() => setExp(move(data.experiences, i, i - 1))}
                onDown={() => setExp(move(data.experiences, i, i + 1))}
                onRemove={() => setExp(data.experiences.filter((_, j) => j !== i))} />
              <div className="row">
                <Field label="Titre" value={s.title} onChange={(v) => patchExp(i, { title: v })} />
                <Select label="Icône" value={s.icon} options={ICONS} onChange={(v) => patchExp(i, { icon: v })} />
              </div>
              <Field label="Détail" value={s.detail} onChange={(v) => patchExp(i, { detail: v })} />
            </div>
          ))}
          <button className="btn" onClick={() => setExp([...data.experiences, { icon: 'music', title: '', detail: '' }])}>+ Ajouter une expérience</button>
        </div>

        <div className="panel">
          <p className="panel-title">Profil / compétences</p>
          <ChipsEditor values={data.skills} onChange={(skills) => update({ ...data, skills })} />
        </div>

        <div className="panel">
          <p className="panel-title">Timeline (desktop)</p>
          {data.timeline.map((s, i) => (
            <div className="list-row" key={i}>
              <RowHead idx={i + 1}
                onUp={() => setTl(move(data.timeline, i, i - 1))}
                onDown={() => setTl(move(data.timeline, i, i + 1))}
                onRemove={() => setTl(data.timeline.filter((_, j) => j !== i))} />
              <div className="row">
                <Field label="Titre" value={s.title} onChange={(v) => patchTl(i, { title: v })} />
                <Field label="Période" value={s.period} onChange={(v) => patchTl(i, { period: v })} />
              </div>
              <Field label="Sous-titre" value={s.subtitle} onChange={(v) => patchTl(i, { subtitle: v })} />
              <div className="row">
                <Select label="Type" value={s.type} options={TYPES} onChange={(v) => patchTl(i, { type: v })} />
                <Select label="Couleur" value={s.strokeColor} options={COLORS} onChange={(v) => patchTl(i, { strokeColor: v })} />
              </div>
            </div>
          ))}
          <button className="btn" onClick={() => setTl([...data.timeline, { title: '', subtitle: '', period: '', type: 'job', strokeColor: 'blue' }])}>+ Ajouter un jalon</button>
        </div>
      </div>
    </>
  );
}
