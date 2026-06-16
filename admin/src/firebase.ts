// Initialisation Firebase du back-office Marco.
// - Config lue depuis les variables Vite (VITE_FIREBASE_*) pour la prod.
// - En dev, VITE_USE_EMULATOR=true branche Auth/Firestore/Storage sur le
//   Firebase Emulator Suite local (aucune action console requise pour coder).
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const USE_EMULATOR = import.meta.env.VITE_USE_EMULATOR === 'true';

// En mode emulateur, un projet prefixe "demo-" reste 100% local (jamais de
// trafic vers Google). En prod, ces valeurs viennent de la console Firebase.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-marco.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-marco',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-marco.appspot.com',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-app',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (USE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export const IS_EMULATOR = USE_EMULATOR;
