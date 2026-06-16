// QA : règle/retire un son de test sur la piste 1 + un média audio de test.
// node scripts/test-song.mjs create|delete
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const action = process.argv[2];
const SONG = 'https://marco-site-2f9aa.web.app/assets/audio/soft-loop.wav';

const ref = db.collection('content').doc('composition');
const snap = await ref.get();
const data = snap.data();

if (action === 'create') {
  await db.collection('media').add({ kind: 'audio', name: 'TEST-song', url: SONG, uploadedAt: Date.now() });
  if (data?.tracks?.[0]) { data.tracks[0].audio = SONG; await ref.set(data); }
  console.log('TEST_SONG_SET');
} else if (action === 'delete') {
  const ms = await db.collection('media').get();
  for (const d of ms.docs) if ((d.data().name || '').startsWith('TEST-')) await d.ref.delete();
  if (data?.tracks?.[0]) { delete data.tracks[0].audio; await ref.set(data); }
  console.log('TEST_SONG_RESTORED');
}
process.exit(0);
