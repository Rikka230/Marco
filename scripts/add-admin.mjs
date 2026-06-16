// Crée (ou met à jour le mot de passe d') un compte admin. node scripts/add-admin.mjs <email>
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const auth = getAuth();

const email = process.argv[2];
if (!email) { console.error('usage: add-admin.mjs <email>'); process.exit(1); }
const pwd = randomBytes(13).toString('base64').replace(/[+/=]/g, '').slice(0, 14) + 'A9$z';

try {
  const u = await auth.createUser({ email, password: pwd, emailVerified: true });
  console.log('CREATED', email, 'uid=' + u.uid);
} catch (e) {
  if (e.code === 'auth/email-already-exists') {
    const u = await auth.getUserByEmail(email);
    await auth.updateUser(u.uid, { password: pwd });
    console.log('UPDATED (existait déjà)', email);
  } else throw e;
}
console.log('PASSWORD=' + pwd);
process.exit(0);
