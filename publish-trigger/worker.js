// Cloudflare Worker — declencheur du bouton "Publier" du back-office.
// Role : verifier que l'appel vient d'un admin connecte (Firebase ID token),
// puis declencher le workflow GitHub Actions de redeploiement (repository_dispatch).
// Gratuit (free tier Cloudflare Workers), aucune carte requise.
//
// Secrets a definir (wrangler secret put ... ) :
//   GITHUB_TOKEN   : PAT fine-grained, repo Marco, permission "Contents: Read and write"
//   GITHUB_REPO    : "owner/nom-du-repo"
//   FIREBASE_API_KEY : Web API key du projet marco-site (validation du token admin)
//
// Deploiement : voir publish-trigger/README.md

const CORS = {
  'Access-Control-Allow-Origin': '*', // a restreindre a l'URL admin en prod
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'method' }, 405);

    // 1. Verifie le Firebase ID token (l'admin doit etre connecte).
    const auth = request.headers.get('Authorization') || '';
    const idToken = auth.replace(/^Bearer\s+/i, '');
    if (!idToken) return json({ error: 'no-token' }, 401);

    const verify = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) },
    );
    if (!verify.ok) return json({ error: 'invalid-token' }, 401);

    // 2. Declenche le workflow GitHub Actions (type "publish").
    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'marco-publish-trigger',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'publish' }),
    });
    if (!gh.ok) return json({ error: 'dispatch-failed', detail: await gh.text() }, 502);

    return json({ ok: true });
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
