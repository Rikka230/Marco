// Cloud Function "publish" — déclencheur du bouton Publier du back-office.
// Vérifie que l'appel vient d'un admin connecté (token Firebase), puis déclenche
// le workflow GitHub Actions (repository_dispatch) qui build + déploie le site.
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

const REPO = 'Rikka230/Marco';

exports.publish = onRequest(
  { cors: true, secrets: ['GITHUB_TOKEN'], region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

    // 1. Vérifie le token Firebase (l'admin doit être connecté).
    const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      await getAuth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({ error: 'auth' });
      return;
    }

    // 2. Déclenche le workflow GitHub Actions.
    const gh = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'marco-publish',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'publish' }),
    });
    if (!gh.ok) {
      res.status(502).json({ error: 'dispatch', detail: await gh.text() });
      return;
    }
    res.json({ ok: true });
  },
);
