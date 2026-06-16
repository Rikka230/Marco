import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { MediaAsset } from '../types';

export default function Media() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
    return onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaAsset, 'id'>) }))));
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

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
          name: file.name, path, url, type: file.type, size: file.size, uploadedAt: Date.now(),
        } satisfies Omit<MediaAsset, 'id'>);
      }
      flash('Upload terminé');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (m: MediaAsset) => {
    await deleteObject(ref(storage, m.path)).catch(() => {});
    await deleteDoc(doc(db, 'media', m.id!));
  };

  return (
    <>
      <div className="topbar">
        <h1>Médias</h1>
        <div className="spacer" />
        <button className="btn btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Upload…' : '+ Importer'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,audio/*" multiple hidden
          onChange={(e) => onUpload(e.target.files)} />
      </div>
      <div className="content">
        {items.length === 0 ? (
          <div className="empty">Aucun média. Importe des images ou pistes audio.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.9rem' }}>
            {items.map((m) => (
              <div className="panel" key={m.id} style={{ padding: '0.7rem' }}>
                {m.type.startsWith('image') ? (
                  <img src={m.url} alt={m.name} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: '0.5rem' }} />
                ) : (
                  <div style={{ height: 110, display: 'grid', placeItems: 'center', background: 'var(--bg-elev)', borderRadius: 8, marginBottom: '0.5rem' }}>♪ audio</div>
                )}
                <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(m.url); flash('URL copiée'); }}>Copier URL</button>
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
