// Seed Firestore content/gallery + content/parcours (objet complet).
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const cov = (n) => `/assets/img/cover-${n}.webp`;
const gallery = {
  strips: [
    { key: 'a', num: '01', headingId: 'strip-editorial', heading: 'Editorial portraits', sub: 'tests / attitude / presence', speed: 72, frames: [
      { id: 'editorial-01', src: cov(1), title: 'Editorial portrait', meta: 'PORTRAIT / LOW KEY / MODEL TEST', label: 'Portrait' },
      { id: 'editorial-02', src: cov(2), title: 'Casting profile', meta: 'CASTING / PROFILE / NATURAL', label: 'Casting' },
      { id: 'editorial-03', src: cov(3), title: 'Campaign face', meta: 'EDITORIAL / CLOSE-UP / CAMPAIGN', label: 'Campaign face', featured: true },
      { id: 'editorial-04', src: cov(4), title: 'Commercial gaze', meta: 'COMMERCIAL / SOFT LOOK / PRESS', label: 'Commercial' },
      { id: 'editorial-05', src: cov(5), title: 'Visual identity', meta: 'IDENTITY / PORTRAIT / BRAND', label: 'Identity' },
      { id: 'editorial-06', src: cov(6), title: 'Press visual', meta: 'PRESS / LOOK BOOK / MODEL', label: 'Press' },
    ] },
    { key: 'b', num: '02', headingId: 'strip-campaign', heading: 'Campaign looks', sub: 'brand / pub / fashion frame', speed: -58, frames: [
      { id: 'campaign-01', src: cov(4), title: 'Brand frame', meta: 'CAMPAIGN / WARDROBE / BLACK SUIT', label: 'Brand frame', wide: true },
      { id: 'campaign-02', src: cov(6), title: 'Lookbook cut', meta: 'LOOKBOOK / FASHION / ATTITUDE', label: 'Lookbook' },
      { id: 'campaign-03', src: cov(2), title: 'Advertising pose', meta: 'ADVERTISING / POSE / CINEMATIC', label: 'Advertising' },
      { id: 'campaign-04', src: cov(1), title: 'Luxury mood', meta: 'LUXURY / EDITORIAL / MOODY', label: 'Luxury mood', featured: true },
      { id: 'campaign-05', src: cov(5), title: 'Poster visual', meta: 'POSTER / CAMPAIGN / FACE', label: 'Poster' },
      { id: 'campaign-06', src: cov(3), title: 'Commercial portrait', meta: 'COMMERCIAL / PORTRAIT / BRAND', label: 'Portrait' },
    ] },
    { key: 'c', num: '03', headingId: 'strip-press', heading: 'Press visuals', sub: 'face range / archive / agency', speed: 48, frames: [
      { id: 'press-01', src: cov(5), title: 'Face range 01', meta: 'PRESS / FACE RANGE / FRONT', label: 'Front' },
      { id: 'press-02', src: cov(3), title: 'Face range 02', meta: 'PRESS / SIDE PROFILE / MOOD', label: 'Profile' },
      { id: 'press-03', src: cov(1), title: 'Expression test', meta: 'CASTING / EXPRESSION / STILL', label: 'Expression' },
      { id: 'press-04', src: cov(2), title: 'Agency visual', meta: 'AGENCY / BOOK / SELECTION', label: 'Agency' },
      { id: 'press-05', src: cov(6), title: 'Mood archive', meta: 'ARCHIVE / BLACK / CINEMA', label: 'Archive' },
      { id: 'press-06', src: cov(4), title: 'Book update', meta: 'BOOK / UPDATE / MODEL', label: 'Book' },
    ] },
  ],
  updatedAt: Date.now(),
};

const parcours = {
  studies: [
    { title: 'Conservatoire', detail: 'Violon classique - Formation musicale - Interprétation', period: '2008 -> 2014' },
    { title: 'Training Acting', detail: 'Jeu caméra - Improvisation - Méthode Stanislavski', period: '2015 -> 2016' },
    { title: 'Développement Artistique', detail: 'Composition - MAO - Direction artistique - Écriture', period: '2016 -> 2018' },
  ],
  mobileChips: [
    { label: 'Formation', target: 'formation', icon: 'study' },
    { label: 'Acting', target: 'acting', icon: 'clapper' },
    { label: 'Composition', target: 'composition', icon: 'waveform' },
    { label: 'Interprète', target: 'interprete', icon: 'mic' },
    { label: 'Modèle', target: 'modele', icon: 'camera' },
  ],
  mobileTimeline: [
    { id: 'formation', icon: 'violin', title: 'Conservatoire', subtitle: 'Violon classique · Formation musicale · Interprétation', period: '2008 - 2014', tone: 'blue' },
    { id: 'acting', icon: 'clapper', title: 'Training Acting', subtitle: 'Jeu caméra · Improvisation · Méthode Stanislavski', period: '2015 - 2016', tone: 'blue' },
    { id: 'composition', icon: 'waveform', title: 'Développement artistique', subtitle: 'Composition · MAO · Direction artistique · Écriture', period: '2016 - 2018', tone: 'blue' },
    { id: 'interprete', icon: 'mic', title: 'Interprète', subtitle: 'Concerts · Sessions · Scène', period: '2019 - 2021', tone: 'green' },
    { id: 'modele', icon: 'camera', title: 'Modèle', subtitle: 'Campagnes · Editorial · Image de marque', period: '2021 - 2023', tone: 'green' },
    { id: 'cinema', icon: 'clapper', title: 'Cinéma', subtitle: 'Courts-métrages · Rôles · Casting', period: '2023 - 2025', tone: 'pink' },
    { id: 'projets', icon: 'stage', title: 'Projets', subtitle: 'Création · Transmission · Performances', period: "2025 - Aujourd'hui", tone: 'green' },
  ],
  timeline: [
    { title: 'Conservatoire', subtitle: 'Violon classique - Formation musicale', period: '2008 - 2014', type: 'formation', strokeColor: 'blue' },
    { title: 'Training Acting', subtitle: 'Jeu caméra - Improvisation', period: '2015 - 2018', type: 'formation', strokeColor: 'green' },
    { title: 'Composition', subtitle: 'MAO - Écriture - Direction artistique', period: '2016 - 2018', type: 'formation', strokeColor: 'pink' },
    { title: 'Interprète', subtitle: 'Concerts - Sessions - Scène', period: '2019 - 2021', type: 'job', strokeColor: 'green' },
    { title: 'Modèle', subtitle: 'Campagnes - Éditorial - Image de marque', period: '2021 - 2023', type: 'job', strokeColor: 'blue' },
    { title: 'Cinéma', subtitle: 'Courts-métrages - Rôles - Casting', period: '2023 - 2025', type: 'job', strokeColor: 'pink' },
    { title: 'Projets', subtitle: 'Création - Transmission - Performances', period: "2025 - Aujourd'hui", type: 'job', strokeColor: 'green' },
  ],
  experiences: [
    { icon: 'music', title: 'Musique', detail: 'Interprète - Compositeur - Arrangements' },
    { icon: 'camera', title: 'Modèle', detail: 'Campagnes - Éditorial - Image de marque' },
    { icon: 'clapper', title: 'Jeu / Cinéma', detail: 'Court-métrages - Rôles - Figuration - Casting' },
    { icon: 'stage', title: 'Scène / Projets', detail: 'Concerts - Performances - Projets artistiques' },
  ],
  skills: ['Discipline', 'Presence', 'Création', 'Rigueur', 'Sens du detail', 'Curiosité'],
  updatedAt: Date.now(),
};

await db.collection('content').doc('gallery').set(gallery);
await db.collection('content').doc('parcours').set(parcours);
console.log('Seed OK : content/gallery (3 bandes), content/parcours (objet complet)');
process.exit(0);
