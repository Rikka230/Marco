// Couche de contenu lue AU BUILD par Astro.
// - Si un service account Firebase est disponible (env FIREBASE_SERVICE_ACCOUNT
//   ou GOOGLE_APPLICATION_CREDENTIALS), lit la collection "content/*" de Firestore.
// - Sinon (dev local sans secret), renvoie les valeurs par defaut = contenu
//   historique du site. La migration est donc transparente et sans risque :
//   tant que l'admin n'a rien publie, le site affiche exactement comme avant.

interface Session { n: string; t: string; sub: string; cat: string; d: string; img: string; active?: boolean; }
interface AvailabilityDate { day: string; t: string; loc: string; }
interface Track { n: string; title: string; meta: string[]; active?: boolean; }
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
