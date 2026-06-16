// Briques reutilisables pour les editeurs de contenu.
import { useState, type ReactNode } from 'react';

export function SaveBar({ title, dirty, saving, onSave }: {
  title: string; dirty: boolean; saving: boolean; onSave: () => void;
}) {
  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div className="spacer" />
      {dirty && <span style={{ color: 'var(--warn)', fontSize: '0.8rem' }}>Modifications non enregistrées</span>}
      <button className="btn btn-primary" disabled={!dirty || saving} onClick={onSave}>
        {saving ? 'Enregistrement…' : 'Enregistrer le brouillon'}
      </button>
    </div>
  );
}

export function Field({ label, value, onChange, textarea }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

// Editeur de liste de chaines (moods, requestTypes, meta d'une piste).
export function ChipsEditor({ values, onChange }: {
  values: string[]; onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v) { onChange([...values, v]); setDraft(''); }
  };
  return (
    <div>
      <div className="chips" style={{ marginBottom: '0.5rem' }}>
        {values.map((v, i) => (
          <span key={i} className="chip">
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
        {values.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Aucun élément</span>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Ajouter…" style={{ flex: 1, padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--bg)', color: 'var(--text)' }} />
        <button type="button" className="btn btn-sm" onClick={add}>Ajouter</button>
      </div>
    </div>
  );
}

// En-tete d'une ligne editable avec deplacement / suppression.
export function RowHead({ idx, onUp, onDown, onRemove, children }: {
  idx: string | number; onUp?: () => void; onDown?: () => void; onRemove: () => void; children?: ReactNode;
}) {
  return (
    <div className="row-head">
      <span className="idx">{idx}</span>
      {children}
      <span className="spacer" />
      {onUp && <button className="btn btn-ghost btn-sm" onClick={onUp} title="Monter">↑</button>}
      {onDown && <button className="btn btn-ghost btn-sm" onClick={onDown} title="Descendre">↓</button>}
      <button className="btn btn-ghost btn-sm btn-danger" onClick={onRemove} title="Supprimer">Suppr</button>
    </div>
  );
}

// Deplace un element d'un tableau (renvoie une copie).
export function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
