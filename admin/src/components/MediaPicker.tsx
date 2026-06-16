import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { MediaAsset, MediaKind } from '../types';
import { IconX, IconAudioLines, IconPlay } from './icons';

function kindOf(m: MediaAsset): MediaKind {
  if (m.kind) return m.kind;
  if (m.type?.startsWith('image')) return 'image';
  if (m.type?.startsWith('audio')) return 'audio';
  return 'video';
}
// URL renvoyée selon le type : embed pour la vidéo, sinon URL du fichier.
function pickUrl(m: MediaAsset): string {
  return kindOf(m) === 'video' ? (m.embedUrl ?? m.url) : m.url;
}

const KIND_LABEL: Record<MediaKind, string> = { image: 'Photos', audio: 'Musique', video: 'Vidéos' };

export default function MediaPicker({ kind, onPick, onClose }: {
  kind?: MediaKind; onPick: (url: string) => void; onClose: () => void;
}) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [tab, setTab] = useState<MediaKind>(kind ?? 'image');

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
    return onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaAsset, 'id'>) }))));
  }, []);

  const activeKind = kind ?? tab;
  const visible = useMemo(() => items.filter((m) => kindOf(m) === activeKind), [items, activeKind]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Bibliothèque — {KIND_LABEL[activeKind]}</h3>
          <div className="spacer" />
          {!kind && (
            <div className="modal-tabs">
              {(['image', 'audio', 'video'] as MediaKind[]).map((k) => (
                <button key={k} className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(k)}>
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer"><IconX size={15} /></button>
        </div>
        <div className="modal-body">
          {visible.length === 0 ? (
            <div className="empty">Rien dans la bibliothèque pour ce type.<br />Importe d'abord dans l'onglet Médias.</div>
          ) : (
            <div className="media-pick-grid">
              {visible.map((m) => (
                <button key={m.id} className="media-pick-item" onClick={() => { onPick(pickUrl(m)); onClose(); }}>
                  <span className="thumb">
                    {activeKind === 'image' && <img src={m.url} alt={m.name} />}
                    {activeKind === 'audio' && <IconAudioLines size={24} />}
                    {activeKind === 'video' && (m.thumbnail ? <img src={m.thumbnail} alt={m.name} /> : <IconPlay size={24} />)}
                  </span>
                  <span className="nm">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
