// Hook d'edition d'un document de contenu (collection "content/{section}").
// Charge le doc, le garde en etat local editable, et l'enregistre en BROUILLON
// dans Firestore (le site public ne change qu'au clic sur "Publier").
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  MusicContent, CompositionContent, BookingContent,
} from './types';

// Valeurs par defaut = contenu actuel du site (seed si le doc n'existe pas encore).
export const DEFAULTS = {
  music: {
    sessions: [
      { n: '01', t: 'CINEMATIC STRINGS', sub: 'Live recording session', cat: 'FULL ENSEMBLE', d: '02:48', img: '/assets/img/bg-music.webp', active: true },
      { n: '02', t: 'SOLO VIOLIN', sub: 'Studio take / intimate', cat: 'SOLO', d: '03:10', img: '/assets/img/bg-violon.webp' },
      { n: '03', t: 'STUDIO RECORDING', sub: 'Multi-take / score', cat: 'SCORE', d: '02:24', img: '/assets/img/bg-scores.webp' },
    ],
    moods: ['CLASSICAL', 'CINEMATIC', 'ORIGINAL SCORE', 'ENSEMBLE', 'IMPROVISATION'],
    dates: [
      { day: '24 MAY 2026', t: 'STUDIO SESSION', loc: 'PARIS' },
      { day: '02 JUN 2026', t: 'LIVE SET', loc: 'ONLINE' },
      { day: '15 JUN 2026', t: 'SCORE SESSION', loc: 'LYON' },
    ],
  } as MusicContent,
  composition: {
    tracks: [
      { n: '01', title: 'Cinematic Strings', meta: ['Score', '2026', '02:48', 'Featured'], active: true },
      { n: '02', title: 'Night Motif', meta: ['Demo', '2026', '01:36', 'Piano / Strings'] },
      { n: '03', title: 'Excursion Theme', meta: ['Campaign', '2026', '02:12', 'Visual'] },
      { n: '04', title: 'Bow Texture', meta: ['Violin + Score', '2025', '03:10', 'Atmosphere'] },
      { n: '05', title: 'Red Cut', meta: ['Original', '2025', '02:04', 'Pulse'] },
    ],
  } as CompositionContent,
  booking: {
    offers: [
      { k: 'LIVE PERFORMANCE', meta: 'SOLO / ENSEMBLE', stat: 'SUR DEVIS' },
      { k: 'FILM SCORE', meta: 'COMPOSITION / SESSION', stat: 'PROJET' },
      { k: 'BRAND / IMAGE', meta: 'ACTING / MODEL', stat: 'CASTING' },
    ],
    requestTypes: ['Booking', 'Collaboration', 'Score / Composition', 'Image / Model', 'Acteur'],
  } as BookingContent,
};

type SectionMap = typeof DEFAULTS;

export function useContentDoc<K extends keyof SectionMap>(section: K) {
  type T = SectionMap[K];
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    getDoc(doc(db, 'content', section))
      .then((snap) => {
        if (!alive) return;
        setData(snap.exists() ? (snap.data() as T) : structuredClone(DEFAULTS[section]));
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setData(structuredClone(DEFAULTS[section]));
        setLoading(false);
      });
    return () => { alive = false; };
  }, [section]);

  const update = useCallback((next: T) => { setData(next); setDirty(true); }, []);

  const save = useCallback(async () => {
    if (!data) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'content', section), { ...data, updatedAt: Date.now() });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [data, section]);

  return { data, update, save, loading, saving, dirty };
}
