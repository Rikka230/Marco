// Seed unique des collections content/* de Firestore avec le contenu OPTIMISE.
// Usage : node scripts/seed-content.mjs  (utilise marco-site-serviceAccount.json)
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const music = {
  sessions: [
    { n: '01', t: 'CINEMATIC STRINGS', sub: 'Live recording session', cat: 'FULL ENSEMBLE', d: '02:48', img: '/assets/img/bg-music.webp', active: true },
    { n: '02', t: 'SOLO VIOLIN', sub: 'Studio take / intimate', cat: 'SOLO', d: '03:10', img: '/assets/img/bg-violon.webp' },
    { n: '03', t: 'STUDIO RECORDING', sub: 'Multi-take / score', cat: 'SCORE', d: '02:24', img: '/assets/img/bg-scores.webp' },
  ],
  moods: ['CLASSICAL', 'CINEMATIC', 'ORIGINAL SCORE', 'ENSEMBLE', 'IMPROVISATION'],
  // Dates rafraichies (les anciennes etaient passees au 16/06/2026).
  dates: [
    { day: '26 JUN 2026', t: 'STUDIO SESSION', loc: 'PARIS' },
    { day: '10 JUL 2026', t: 'LIVE SET', loc: 'ONLINE' },
    { day: '23 JUL 2026', t: 'SCORE SESSION', loc: 'LYON' },
  ],
  updatedAt: Date.now(),
};

// Optimisation : on ne garde que les pistes reelles, pas les 14 "Placeholder/Template".
const composition = {
  tracks: [
    { n: '01', title: 'Cinematic Strings', meta: ['Score', '2026', '02:48', 'Featured'], active: true },
    { n: '02', title: 'Night Motif', meta: ['Demo', '2026', '01:36', 'Piano / Strings'] },
    { n: '03', title: 'Excursion Theme', meta: ['Campaign', '2026', '02:12', 'Visual'] },
    { n: '04', title: 'Bow Texture', meta: ['Violin + Score', '2025', '03:10', 'Atmosphere'] },
    { n: '05', title: 'Red Cut', meta: ['Original', '2025', '02:04', 'Pulse'] },
    { n: '06', title: 'Stage Lines', meta: ['Stage', '2025', '02:52', 'Scene'] },
  ],
  updatedAt: Date.now(),
};

const booking = {
  offers: [
    { k: 'LIVE PERFORMANCE', meta: 'SOLO / ENSEMBLE', stat: 'SUR DEVIS' },
    { k: 'FILM SCORE', meta: 'COMPOSITION / SESSION', stat: 'PROJET' },
    { k: 'BRAND / IMAGE', meta: 'ACTING / MODEL', stat: 'CASTING' },
  ],
  requestTypes: ['Booking', 'Collaboration', 'Score / Composition', 'Image / Model', 'Acteur'],
  updatedAt: Date.now(),
};

await db.collection('content').doc('music').set(music);
await db.collection('content').doc('composition').set(composition);
await db.collection('content').doc('booking').set(booking);
console.log('Seed OK : content/music, content/composition (6 pistes), content/booking');
process.exit(0);
