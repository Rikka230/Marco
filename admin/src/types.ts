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
  audio?: string;   // URL du son joué au clic sur Play
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

// Page Modele (gallery) : bandes photo.
export interface GalleryFrame { id: string; src: string; title: string; meta: string; label: string; featured?: boolean; wide?: boolean; }
export interface GalleryStrip { key: 'a' | 'b' | 'c'; num: string; headingId: string; heading: string; sub: string; speed: number; frames: GalleryFrame[]; }
export interface GalleryContent { strips: GalleryStrip[]; }

// Page Parcours.
export interface ParcoursStudy { title: string; detail: string; period: string; }
export interface ParcoursExperience { icon: string; title: string; detail: string; }
export interface ParcoursTimelineItem { title: string; subtitle: string; period: string; type: string; strokeColor: string; }
export interface ParcoursContent {
  studies: ParcoursStudy[];
  experiences: ParcoursExperience[];
  skills: string[];
  timeline: ParcoursTimelineItem[];
  // Conserves tels quels (flux mobile), non edites dans l'UI simple :
  mobileChips?: unknown[];
  mobileTimeline?: unknown[];
}

export type ContentSection = 'music' | 'composition' | 'booking' | 'gallery' | 'parcours';

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

export type MediaKind = 'image' | 'audio' | 'video';

export interface MediaAsset {
  id?: string;
  kind: MediaKind;
  name: string;
  url: string;           // download URL (fichiers) ou URL source (video)
  path?: string;         // chemin Storage (fichiers uniquement)
  type?: string;         // mime (fichiers)
  size?: number;
  uploadedAt: number;
  // Champs video (embed auto) :
  provider?: 'youtube' | 'vimeo' | 'file'; // source de la video
  embedUrl?: string;     // URL d'integration <iframe>
  thumbnail?: string;    // vignette
}
