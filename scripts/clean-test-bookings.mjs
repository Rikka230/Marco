// Supprime les demandes de test (sujet commençant par "E2E-").
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const snap = await db.collection('bookings').get();
let n = 0;
for (const doc of snap.docs) {
  if ((doc.data().subject || '').startsWith('E2E-')) { await doc.ref.delete(); n++; }
}
console.log(`Supprimé ${n} demande(s) de test.`);
process.exit(0);
