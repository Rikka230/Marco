// Définit le compte admin unique : crée nocx230@hotmail.com, retire l'ancien.
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const sa = JSON.parse(readFileSync(new URL('../marco-site-serviceAccount.json', import.meta.url)));
initializeApp({ credential: cert(sa) });
const auth = getAuth();

const NEW_EMAIL = 'nocx230@hotmail.com';
const OLD_EMAIL = 'gorille1212@gmail.com';

// Mot de passe fort (18 car., classes mélangées).
const pwd = randomBytes(13).toString('base64').replace(/[+/=]/g, '').slice(0, 14) + 'A9$z';

// Crée (ou met à jour) le nouvel admin.
let uid;
try {
  const u = await auth.createUser({ email: NEW_EMAIL, password: pwd, emailVerified: true });
  uid = u.uid;
  console.log('CREATED', NEW_EMAIL, 'uid=' + uid);
} catch (e) {
  if (e.code === 'auth/email-already-exists') {
    const u = await auth.getUserByEmail(NEW_EMAIL);
    await auth.updateUser(u.uid, { password: pwd });
    uid = u.uid;
    console.log('UPDATED (existait déjà)', NEW_EMAIL, 'uid=' + uid);
  } else throw e;
}

// Supprime l'ancien compte.
try {
  const old = await auth.getUserByEmail(OLD_EMAIL);
  await auth.deleteUser(old.uid);
  console.log('DELETED', OLD_EMAIL);
} catch (e) {
  console.log('ancien compte absent ou déjà supprimé:', e.code || e.message);
}

console.log('PASSWORD=' + pwd);
process.exit(0);
