import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { MediaAsset, MediaKind } from '../types';
import { parseVideoUrl } from '../video';

const TABS: { key: MediaKind; label: string; accept: string }[] = [
  { key: 'image', label: 'Photos', accept: 'image/*' },
  { key: 'audio', label: 'Musique', accept: 'audio/*' },
  { key: 'video', label: 'Vidéos', accept: '' },
];

// Compat : deduit le type d'un media qui n'aurait pas de champ "kind".
function kindOf(m: MediaAsset): MediaKind {
  if (m.kind) return m.kind;
  if (m.type?.startsWith('image')) return 'image';
  if (m.type?.startsWith('audio')) return 'audio';
  return 'video';
}

export default function Media() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [tab, setTab] = useState<MediaKind>('image');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
    return onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaAsset, 'id'>) }))));
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const visible = useMemo(() => items.filter((m) => kindOf(m) === tab), [items, tab]);

  // Upload de fichiers (photos / audio).
  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = `media/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const r = ref(storage, path);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        await addDoc(collection(db, 'media'), {
          kind: tab, name: file.name, path, url,
          type: file.type, size: file.size, uploadedAt: Date.now(),
        } satisfies Omit<MediaAsset, 'id'>);
      }
      flash('Upload terminé');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Ajout d'une video par URL (embed auto).
  const onAddVideo = async () => {
    const parsed = parseVideoUrl(videoUrl);
    if (!parsed) { flash('URL non reconnue (YouTube, Vimeo ou .mp4)'); return; }
    setBusy(true);
    try {
      await addDoc(collection(db, 'media'), {
        kind: 'video', name: parsed.name!, url: videoUrl.trim(),
        provider: parsed.provider, embedUrl: parsed.embedUrl, thumbnail: parsed.thumbnail,
        uploadedAt: Date.now(),
      } satisfies Omit<MediaAsset, 'id'>);
      setVideoUrl('');
      flash('Vidéo ajoutée');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: MediaAsset) => {
    if (m.path) await deleteObject(ref(storage, m.path)).catch(() => {});
    await deleteDoc(doc(db, 'media', m.id!));
  };

  return (
    <>
      <div className="topbar">
        <h1>Médias</h1>
        <div className="spacer" />
        {TABS.map((t) => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
        {tab !== 'video' && (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}
            style={{ marginLeft: '0.6rem' }}>
            {busy ? 'Upload…' : tab === 'image' ? '+ Importer une photo' : '+ Importer un audio'}
          </button>
        )}
        <input ref={fileRef} type="file" accept={TABS.find((t) => t.key === tab)?.accept} multiple hidden
          onChange={(e) => onUpload(e.target.files)} />
      </div>

      <div className="content">
        {tab === 'video' && (
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <p className="panel-title">Ajouter une vidéo par URL (embed automatique)</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onAddVideo(); }}
                placeholder="https://youtube.com/watch?v=…  ·  vimeo.com/…  ·  …/clip.mp4"
                style={{ flex: 1, padding: '0.6rem 0.7rem', borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--bg)', color: 'var(--text)' }} />
              <button className="btn btn-primary" disabled={busy} onClick={onAddVideo}>Ajouter</button>
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="empty">
            {tab === 'image' ? 'Aucune photo.' : tab === 'audio' ? 'Aucune piste audio.' : 'Aucune vidéo.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.9rem' }}>
            {visible.map((m) => (
              <div className="panel" key={m.id} style={{ padding: '0.7rem' }}>
                {tab === 'image' && (
                  <img src={m.url} alt={m.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: '0.5rem' }} />
                )}
                {tab === 'audio' && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ height: 70, display: 'grid', placeItems: 'center', background: 'var(--bg-elev)', borderRadius: 8, marginBottom: '0.4rem', fontSize: '1.4rem' }}>♪</div>
                    <audio controls src={m.url} style={{ width: '100%', height: 32 }} />
                  </div>
                )}
                {tab === 'video' && (
                  <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                    {m.thumbnail
                      ? <img src={m.thumbnail} alt={m.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                      : <div style={{ height: 120, display: 'grid', placeItems: 'center', background: 'var(--bg-elev)', borderRadius: 8, fontSize: '1.6rem' }}>▶</div>}
                    <a href={m.url} target="_blank" rel="noreferrer"
                      style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }} aria-label="Ouvrir la vidéo">
                      <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'grid', placeItems: 'center' }}>▶</span>
                    </a>
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(m.kind === 'video' ? (m.embedUrl ?? m.url) : m.url); flash('URL copiée'); }}>
                    Copier {m.kind === 'video' ? 'embed' : 'URL'}
                  </button>
                  <button className="btn btn-sm btn-ghost btn-danger" onClick={() => remove(m)}>Suppr</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
