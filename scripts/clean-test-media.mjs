// Supprime les medias de test (id YouTube dQw4w9WgXcQ).
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const snap = await db.collection('media').get();
let n = 0;
for (const doc of snap.docs) {
  if ((doc.data().url || '').includes('dQw4w9WgXcQ')) { await doc.ref.delete(); n++; }
}
console.log(`Supprimé ${n} média(s) de test.`);
process.exit(0);
