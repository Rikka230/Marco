// QA : seed/supprime des médias de test. node scripts/test-media.mjs create|delete
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const action = process.argv[2];
const BASE = 'https://marco-site-2f9aa.web.app';

if (action === 'create') {
  for (const n of [1, 2, 3]) {
    await db.collection('media').add({
      kind: 'image', name: `TEST-cover-${n}`, url: `${BASE}/assets/img/cover-${n}.webp`, uploadedAt: Date.now() + n,
    });
  }
  console.log('TEST_MEDIA_CREATED');
} else if (action === 'delete') {
  const snap = await db.collection('media').get();
  let c = 0;
  for (const d of snap.docs) if ((d.data().name || '').startsWith('TEST-')) { await d.ref.delete(); c++; }
  console.log('TEST_MEDIA_DELETED ' + c);
}
process.exit(0);
