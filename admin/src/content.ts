// Hook d'edition d'un document de contenu (collection "content/{section}").
// Charge le doc, le garde en etat local editable, et l'enregistre en BROUILLON
// dans Firestore (le site public ne change qu'au clic sur "Publier").
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  MusicContent, CompositionContent, BookingContent, GalleryContent, ParcoursContent,
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
  gallery: {
    strips: [
      { key: 'a', num: '01', headingId: 'strip-editorial', heading: 'Editorial portraits', sub: 'tests / attitude / presence', speed: 72, frames: [
        { id: 'editorial-01', src: '/assets/img/cover-1.webp', title: 'Editorial portrait', meta: 'PORTRAIT / LOW KEY / MODEL TEST', label: 'Portrait' },
        { id: 'editorial-02', src: '/assets/img/cover-2.webp', title: 'Casting profile', meta: 'CASTING / PROFILE / NATURAL', label: 'Casting' },
        { id: 'editorial-03', src: '/assets/img/cover-3.webp', title: 'Campaign face', meta: 'EDITORIAL / CLOSE-UP / CAMPAIGN', label: 'Campaign face', featured: true },
        { id: 'editorial-04', src: '/assets/img/cover-4.webp', title: 'Commercial gaze', meta: 'COMMERCIAL / SOFT LOOK / PRESS', label: 'Commercial' },
        { id: 'editorial-05', src: '/assets/img/cover-5.webp', title: 'Visual identity', meta: 'IDENTITY / PORTRAIT / BRAND', label: 'Identity' },
        { id: 'editorial-06', src: '/assets/img/cover-6.webp', title: 'Press visual', meta: 'PRESS / LOOK BOOK / MODEL', label: 'Press' },
      ] },
      { key: 'b', num: '02', headingId: 'strip-campaign', heading: 'Campaign looks', sub: 'brand / pub / fashion frame', speed: -58, frames: [
        { id: 'campaign-01', src: '/assets/img/cover-4.webp', title: 'Brand frame', meta: 'CAMPAIGN / WARDROBE / BLACK SUIT', label: 'Brand frame', wide: true },
        { id: 'campaign-02', src: '/assets/img/cover-6.webp', title: 'Lookbook cut', meta: 'LOOKBOOK / FASHION / ATTITUDE', label: 'Lookbook' },
        { id: 'campaign-03', src: '/assets/img/cover-2.webp', title: 'Advertising pose', meta: 'ADVERTISING / POSE / CINEMATIC', label: 'Advertising' },
        { id: 'campaign-04', src: '/assets/img/cover-1.webp', title: 'Luxury mood', meta: 'LUXURY / EDITORIAL / MOODY', label: 'Luxury mood', featured: true },
        { id: 'campaign-05', src: '/assets/img/cover-5.webp', title: 'Poster visual', meta: 'POSTER / CAMPAIGN / FACE', label: 'Poster' },
        { id: 'campaign-06', src: '/assets/img/cover-3.webp', title: 'Commercial portrait', meta: 'COMMERCIAL / PORTRAIT / BRAND', label: 'Portrait' },
      ] },
      { key: 'c', num: '03', headingId: 'strip-press', heading: 'Press visuals', sub: 'face range / archive / agency', speed: 48, frames: [
        { id: 'press-01', src: '/assets/img/cover-5.webp', title: 'Face range 01', meta: 'PRESS / FACE RANGE / FRONT', label: 'Front' },
        { id: 'press-02', src: '/assets/img/cover-3.webp', title: 'Face range 02', meta: 'PRESS / SIDE PROFILE / MOOD', label: 'Profile' },
        { id: 'press-03', src: '/assets/img/cover-1.webp', title: 'Expression test', meta: 'CASTING / EXPRESSION / STILL', label: 'Expression' },
        { id: 'press-04', src: '/assets/img/cover-2.webp', title: 'Agency visual', meta: 'AGENCY / BOOK / SELECTION', label: 'Agency' },
        { id: 'press-05', src: '/assets/img/cover-6.webp', title: 'Mood archive', meta: 'ARCHIVE / BLACK / CINEMA', label: 'Archive' },
        { id: 'press-06', src: '/assets/img/cover-4.webp', title: 'Book update', meta: 'BOOK / UPDATE / MODEL', label: 'Book' },
      ] },
    ],
  } as GalleryContent,
  parcours: {
    studies: [
      { title: 'Conservatoire', detail: 'Violon classique - Formation musicale - Interprétation', period: '2008 -> 2014' },
      { title: 'Training Acting', detail: 'Jeu caméra - Improvisation - Méthode Stanislavski', period: '2015 -> 2016' },
      { title: 'Développement Artistique', detail: 'Composition - MAO - Direction artistique - Écriture', period: '2016 -> 2018' },
    ],
    experiences: [
      { icon: 'music', title: 'Musique', detail: 'Interprète - Compositeur - Arrangements' },
      { icon: 'camera', title: 'Modèle', detail: 'Campagnes - Éditorial - Image de marque' },
      { icon: 'clapper', title: 'Jeu / Cinéma', detail: 'Court-métrages - Rôles - Figuration - Casting' },
      { icon: 'stage', title: 'Scène / Projets', detail: 'Concerts - Performances - Projets artistiques' },
    ],
    skills: ['Discipline', 'Presence', 'Création', 'Rigueur', 'Sens du detail', 'Curiosité'],
    timeline: [
      { title: 'Conservatoire', subtitle: 'Violon classique - Formation musicale', period: '2008 - 2014', type: 'formation', strokeColor: 'blue' },
      { title: 'Training Acting', subtitle: 'Jeu caméra - Improvisation', period: '2015 - 2018', type: 'formation', strokeColor: 'green' },
      { title: 'Composition', subtitle: 'MAO - Écriture - Direction artistique', period: '2016 - 2018', type: 'formation', strokeColor: 'pink' },
      { title: 'Interprète', subtitle: 'Concerts - Sessions - Scène', period: '2019 - 2021', type: 'job', strokeColor: 'green' },
      { title: 'Modèle', subtitle: 'Campagnes - Éditorial - Image de marque', period: '2021 - 2023', type: 'job', strokeColor: 'blue' },
      { title: 'Cinéma', subtitle: 'Courts-métrages - Rôles - Casting', period: '2023 - 2025', type: 'job', strokeColor: 'pink' },
      { title: 'Projets', subtitle: 'Création - Transmission - Performances', period: "2025 - Aujourd'hui", type: 'job', strokeColor: 'green' },
    ],
  } as ParcoursContent,
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
