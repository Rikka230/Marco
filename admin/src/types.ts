// Types de donnees partages — calques EXACTEMENT sur le contenu aujourd'hui
// code en dur dans les pages .astro, pour que la migration soit transparente.

// --- Contenu editable (collection Firestore "content/{section}") ---

// Page Violon (music.astro) : cartes Live Sessions.
export interface Session {
  n: string;        // "01"
  t: string;        // titre
  sub: string;      // sous-titre
  cat: string;      // categorie (FULL ENSEMBLE...)
  d: string;        // duree "02:48"
  img: string;      // chemin/URL de la vignette
  active?: boolean; // carte mise en avant
}

// Page Violon : disponibilites (UPCOMING / AVAILABILITY).
export interface AvailabilityDate {
  day: string;      // "24 MAY 2026"
  t: string;        // "STUDIO SESSION"
  loc: string;      // "PARIS"
}

// Page Composition (composition.astro) : pistes du catalogue.
export interface Track {
  n: string;        // "01"
  title: string;
  meta: string[];   // ["Score", "2026", "02:48", "Featured"]
  active?: boolean;
}

// Page Booking (contact.astro) : cartes d'offres.
export interface BookingOffer {
  k: string;        // "LIVE PERFORMANCE"
  meta: string;     // "SOLO / ENSEMBLE"
  stat: string;     // "SUR DEVIS"
}

// Bloc de contenu complet par section (1 document Firestore par section).
export interface MusicContent {
  sessions: Session[];
  moods: string[];
  dates: AvailabilityDate[];
}
export interface CompositionContent {
  tracks: Track[];
}
export interface BookingContent {
  offers: BookingOffer[];
  requestTypes: string[];
}

export type ContentSection = 'music' | 'composition' | 'booking';

// --- Demandes entrantes (collection Firestore "bookings") ---

export type BookingStatus = 'nouveau' | 'lu' | 'traite' | 'archive';

export interface BookingRequest {
  id?: string;
  name: string;
  email: string;
  requestType: string;
  subject: string;
  message: string;
  status: BookingStatus;
  createdAt: number;     // Date.now() a la soumission
  source?: string;       // page d'origine
}

// --- Medias (collection Firestore "media" + Storage) ---

export interface MediaAsset {
  id?: string;
  name: string;
  path: string;          // chemin Storage
  url: string;           // download URL
  type: string;          // mime
  size: number;
  uploadedAt: number;
}
