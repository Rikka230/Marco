// Envoi d'une demande de booking depuis le formulaire public vers Firestore.
// Firebase est charge en import dynamique (chunk separe) => zero impact sur le
// bundle initial du site ; il n'est telecharge que lors d'une soumission.
// Config lue depuis les variables Astro PUBLIC_FIREBASE_* (injectees au build).

interface BookingPayload {
  name: string;
  email: string;
  requestType: string;
  subject: string;
  message: string;
  source?: string;
}

const cfg = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

export function bookingConfigured(): boolean {
  return Boolean(cfg.apiKey && cfg.projectId);
}

export async function submitBooking(payload: BookingPayload): Promise<void> {
  if (!bookingConfigured()) {
    throw new Error('not-configured');
  }
  const { initializeApp, getApps } = await import('firebase/app');
  const { getFirestore, collection, addDoc } = await import('firebase/firestore');
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);
  await addDoc(collection(db, 'bookings'), {
    ...payload,
    status: 'nouveau',
    createdAt: Date.now(),
  });
}
