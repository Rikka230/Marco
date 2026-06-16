// Couche de contenu lue AU BUILD par Astro.
// - Si un service account Firebase est disponible (env FIREBASE_SERVICE_ACCOUNT
//   ou GOOGLE_APPLICATION_CREDENTIALS), lit la collection "content/*" de Firestore.
// - Sinon (dev local sans secret), renvoie les valeurs par defaut = contenu
//   historique du site. La migration est donc transparente et sans risque :
//   tant que l'admin n'a rien publie, le site affiche exactement comme avant.

interface Session { n: string; t: string; sub: string; cat: string; d: string; img: string; active?: boolean; }
interface AvailabilityDate { day: string; t: string; loc: string; }
interface Track { n: string; title: string; meta: string[]; active?: boolean; audio?: string; }
interface BookingOffer { k: string; meta: string; stat: string; }

export interface MusicContent { sessions: Session[]; moods: string[]; dates: AvailabilityDate[]; }
export interface CompositionContent { tracks: Track[]; }
export interface BookingContent { offers: BookingOffer[]; requestTypes: string[]; }

// --- Valeurs par defaut (identiques au contenu actuel des pages) ---
const DEFAULT_MUSIC: MusicContent = {
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
};

const DEFAULT_COMPOSITION: CompositionContent = {
  tracks: [
    { n: '01', title: 'Cinematic Strings', meta: ['Score', '2026', '02:48', 'Featured'], active: true },
    { n: '02', title: 'Night Motif', meta: ['Demo', '2026', '01:36', 'Piano / Strings'] },
    { n: '03', title: 'Excursion Theme', meta: ['Campaign', '2026', '02:12', 'Visual'] },
    { n: '04', title: 'Bow Texture', meta: ['Violin + Score', '2025', '03:10', 'Atmosphere'] },
    { n: '05', title: 'Red Cut', meta: ['Original', '2025', '02:04', 'Pulse'] },
    { n: '06', title: 'Stage Lines', meta: ['Stage', '2025', '02:52', 'Scene'] },
    { n: '07', title: 'Glass Motif', meta: ['Placeholder', '2026', '01:44', 'Texture'] },
    { n: '08', title: 'Low Room', meta: ['Placeholder', '2026', '02:26', 'Ambient'] },
    { n: '09', title: 'First Cut', meta: ['Placeholder', '2026', '01:58', 'Draft'] },
    { n: '10', title: 'End Theme', meta: ['Placeholder', '2026', '03:04', 'Finale'] },
    { n: '11', title: 'Ash Corridor', meta: ['Template', '2026', '02:11', 'Drama'] },
    { n: '12', title: 'Glass Pulse', meta: ['Template', '2026', '01:47', 'Rhythm'] },
    { n: '13', title: 'Velvet Tension', meta: ['Template', '2026', '02:38', 'Suspense'] },
    { n: '14', title: 'Piano Residue', meta: ['Template', '2026', '01:32', 'Minimal'] },
    { n: '15', title: 'Dark Waltz', meta: ['Template', '2026', '02:54', 'Motion'] },
    { n: '16', title: 'Mute Signals', meta: ['Template', '2026', '01:59', 'Texture'] },
    { n: '17', title: 'Red Passage', meta: ['Template', '2026', '02:23', 'Score'] },
    { n: '18', title: 'Nocturne Frame', meta: ['Template', '2026', '03:12', 'Theme'] },
    { n: '19', title: 'Last Cue', meta: ['Template', '2026', '01:41', 'Cue'] },
    { n: '20', title: 'Final Room', meta: ['Template', '2026', '02:35', 'Finale'] },
  ],
};

const DEFAULT_BOOKING: BookingContent = {
  offers: [
    { k: 'LIVE PERFORMANCE', meta: 'SOLO / ENSEMBLE', stat: 'SUR DEVIS' },
    { k: 'FILM SCORE', meta: 'COMPOSITION / SESSION', stat: 'PROJET' },
    { k: 'BRAND / IMAGE', meta: 'ACTING / MODEL', stat: 'CASTING' },
  ],
  requestTypes: ['Booking', 'Collaboration', 'Score / Composition', 'Image / Model', 'Acteur'],
};

// --- Lecture Firestore au build (Admin SDK), avec cache process ---
let cache: Record<string, unknown> | null = null;

async function loadAll(): Promise<Record<string, unknown>> {
  if (cache) return cache;
  cache = {};

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasDefaultCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw && !hasDefaultCreds) return cache; // pas de secret => fallback partout

  try {
    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    if (!getApps().length) {
      initializeApp({ credential: raw ? cert(JSON.parse(raw)) : applicationDefault() });
    }
    const dbAdmin = getFirestore();
    const snap = await dbAdmin.collection('content').get();
    snap.forEach((doc) => { cache![doc.id] = doc.data(); });
  } catch (e) {
    console.warn('[content] lecture Firestore impossible, fallback hardcode:', (e as Error).message);
  }
  return cache;
}

function nonEmpty<T extends object>(v: unknown, fallback: T): T {
  return v && typeof v === 'object' ? { ...fallback, ...(v as object) } as T : fallback;
}

export async function getMusicContent(): Promise<MusicContent> {
  const all = await loadAll();
  return nonEmpty(all.music, DEFAULT_MUSIC);
}
export async function getCompositionContent(): Promise<CompositionContent> {
  const all = await loadAll();
  return nonEmpty(all.composition, DEFAULT_COMPOSITION);
}
export async function getBookingContent(): Promise<BookingContent> {
  const all = await loadAll();
  return nonEmpty(all.booking, DEFAULT_BOOKING);
}

// --- Page Modele (gallery) : 3 bandes photo ---
export interface GalleryFrame { id: string; src: string; title: string; meta: string; label: string; featured?: boolean; wide?: boolean; }
export interface GalleryStrip { key: 'a' | 'b' | 'c'; num: string; headingId: string; heading: string; sub: string; speed: number; frames: GalleryFrame[]; }
export interface GalleryContent { strips: GalleryStrip[]; }

const cov = (n: number) => `/assets/img/cover-${n}.webp`;
const DEFAULT_GALLERY: GalleryContent = {
  strips: [
    {
      key: 'a', num: '01', headingId: 'strip-editorial', heading: 'Editorial portraits', sub: 'tests / attitude / presence', speed: 72,
      frames: [
        { id: 'editorial-01', src: cov(1), title: 'Editorial portrait', meta: 'PORTRAIT / LOW KEY / MODEL TEST', label: 'Portrait' },
        { id: 'editorial-02', src: cov(2), title: 'Casting profile', meta: 'CASTING / PROFILE / NATURAL', label: 'Casting' },
        { id: 'editorial-03', src: cov(3), title: 'Campaign face', meta: 'EDITORIAL / CLOSE-UP / CAMPAIGN', label: 'Campaign face', featured: true },
        { id: 'editorial-04', src: cov(4), title: 'Commercial gaze', meta: 'COMMERCIAL / SOFT LOOK / PRESS', label: 'Commercial' },
        { id: 'editorial-05', src: cov(5), title: 'Visual identity', meta: 'IDENTITY / PORTRAIT / BRAND', label: 'Identity' },
        { id: 'editorial-06', src: cov(6), title: 'Press visual', meta: 'PRESS / LOOK BOOK / MODEL', label: 'Press' },
      ],
    },
    {
      key: 'b', num: '02', headingId: 'strip-campaign', heading: 'Campaign looks', sub: 'brand / pub / fashion frame', speed: -58,
      frames: [
        { id: 'campaign-01', src: cov(4), title: 'Brand frame', meta: 'CAMPAIGN / WARDROBE / BLACK SUIT', label: 'Brand frame', wide: true },
        { id: 'campaign-02', src: cov(6), title: 'Lookbook cut', meta: 'LOOKBOOK / FASHION / ATTITUDE', label: 'Lookbook' },
        { id: 'campaign-03', src: cov(2), title: 'Advertising pose', meta: 'ADVERTISING / POSE / CINEMATIC', label: 'Advertising' },
        { id: 'campaign-04', src: cov(1), title: 'Luxury mood', meta: 'LUXURY / EDITORIAL / MOODY', label: 'Luxury mood', featured: true },
        { id: 'campaign-05', src: cov(5), title: 'Poster visual', meta: 'POSTER / CAMPAIGN / FACE', label: 'Poster' },
        { id: 'campaign-06', src: cov(3), title: 'Commercial portrait', meta: 'COMMERCIAL / PORTRAIT / BRAND', label: 'Portrait' },
      ],
    },
    {
      key: 'c', num: '03', headingId: 'strip-press', heading: 'Press visuals', sub: 'face range / archive / agency', speed: 48,
      frames: [
        { id: 'press-01', src: cov(5), title: 'Face range 01', meta: 'PRESS / FACE RANGE / FRONT', label: 'Front' },
        { id: 'press-02', src: cov(3), title: 'Face range 02', meta: 'PRESS / SIDE PROFILE / MOOD', label: 'Profile' },
        { id: 'press-03', src: cov(1), title: 'Expression test', meta: 'CASTING / EXPRESSION / STILL', label: 'Expression' },
        { id: 'press-04', src: cov(2), title: 'Agency visual', meta: 'AGENCY / BOOK / SELECTION', label: 'Agency' },
        { id: 'press-05', src: cov(6), title: 'Mood archive', meta: 'ARCHIVE / BLACK / CINEMA', label: 'Archive' },
        { id: 'press-06', src: cov(4), title: 'Book update', meta: 'BOOK / UPDATE / MODEL', label: 'Book' },
      ],
    },
  ],
};

export async function getGalleryContent(): Promise<GalleryContent> {
  const all = await loadAll();
  const g = all.gallery as GalleryContent | undefined;
  return g && Array.isArray(g.strips) && g.strips.length ? g : DEFAULT_GALLERY;
}

// --- Page Parcours : objet complet ou null (le JS a son propre fallback) ---
export async function getParcoursContent(): Promise<Record<string, unknown> | null> {
  const all = await loadAll();
  const pc = all.parcours as Record<string, unknown> | undefined;
  return pc && Object.keys(pc).length ? pc : null;
}
