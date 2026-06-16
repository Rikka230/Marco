import { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BookingRequest, BookingStatus } from '../types';

const STATUS_LABEL: Record<BookingStatus, string> = {
  nouveau: 'Nouveau', lu: 'Lu', traite: 'Traité', archive: 'Archivé',
};

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return "à l'instant";
  if (d < 3600) return `il y a ${Math.floor(d / 60)} min`;
  if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`;
  return new Date(ts).toLocaleDateString('fr-FR');
}

export default function Bookings() {
  const [items, setItems] = useState<BookingRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'actifs' | 'tous' | 'archive'>('actifs');

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BookingRequest, 'id'>) })));
    });
  }, []);

  const visible = useMemo(() => items.filter((it) => {
    if (filter === 'tous') return true;
    if (filter === 'archive') return it.status === 'archive';
    return it.status !== 'archive';
  }), [items, filter]);

  const selected = items.find((it) => it.id === selectedId) ?? null;

  // Marque "lu" a l'ouverture d'une demande nouvelle.
  useEffect(() => {
    if (selected && selected.status === 'nouveau' && selected.id) {
      updateDoc(doc(db, 'bookings', selected.id), { status: 'lu' }).catch(() => {});
    }
  }, [selected]);

  const setStatus = (id: string, status: BookingStatus) =>
    updateDoc(doc(db, 'bookings', id), { status }).catch(() => {});

  return (
    <>
      <div className="topbar">
        <h1>Demandes de booking</h1>
        <div className="spacer" />
        {(['actifs', 'tous', 'archive'] as const).map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}>
            {f === 'actifs' ? 'Actifs' : f === 'tous' ? 'Tous' : 'Archivés'}
          </button>
        ))}
      </div>

      <div className="content">
        {visible.length === 0 ? (
          <div className="empty">Aucune demande {filter === 'archive' ? 'archivée' : 'pour le moment'}.</div>
        ) : (
          <div className="inbox">
            <div className="inbox-list">
              {visible.map((it) => (
                <button key={it.id}
                  className={`inbox-item ${it.id === selectedId ? 'active' : ''} ${it.status === 'nouveau' ? 'unread' : ''}`}
                  onClick={() => setSelectedId(it.id!)}>
                  <div className="it-top">
                    <span className="it-name">{it.name}</span>
                    <span className="it-time">{timeAgo(it.createdAt)}</span>
                  </div>
                  <div className="it-sub">{it.requestType} · {it.subject}</div>
                  <span className={`tag ${it.status}`}>{STATUS_LABEL[it.status]}</span>
                </button>
              ))}
            </div>

            <div className="panel detail">
              {selected ? (
                <>
                  <h2>{selected.subject}</h2>
                  <div className="meta-line">
                    <strong>{selected.name}</strong> · <a href={`mailto:${selected.email}`}>{selected.email}</a>
                    {' · '}{selected.requestType}{' · '}{new Date(selected.createdAt).toLocaleString('fr-FR')}
                  </div>
                  <p className="message">{selected.message}</p>
                  <div className="actions">
                    <a className="btn btn-primary"
                      href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}>
                      Répondre par email
                    </a>
                    <button className="btn" onClick={() => setStatus(selected.id!, 'traite')}>Marquer traité</button>
                    <button className="btn btn-ghost" onClick={() => setStatus(selected.id!, 'archive')}>Archiver</button>
                    {selected.status === 'archive' && (
                      <button className="btn btn-ghost" onClick={() => setStatus(selected.id!, 'lu')}>Désarchiver</button>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty">Sélectionne une demande pour la lire.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
