// Utilitaire QA : cree/supprime un compte de test. node scripts/temp-user.mjs create|delete
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const auth = getAuth();
const EMAIL = 'qa-temp@marco-site.test';
const PWD = 'QaTemp!2026xZ';
const action = process.argv[2];

if (action === 'create') {
  try { await auth.createUser({ email: EMAIL, password: PWD, emailVerified: true }); }
  catch (e) { if (e.code !== 'auth/email-already-exists') throw e; }
  console.log('TEMP_READY ' + EMAIL + ' / ' + PWD);
} else if (action === 'delete') {
  try { const u = await auth.getUserByEmail(EMAIL); await auth.deleteUser(u.uid); console.log('TEMP_DELETED'); }
  catch { console.log('TEMP_ABSENT'); }
}
process.exit(0);
