import { useState } from 'react';
import { auth } from '../firebase';

// Declenche la reconstruction + deploiement du site public.
// L'endpoint (Cloudflare Worker gratuit qui appelle GitHub Actions) est
// configurable via VITE_PUBLISH_ENDPOINT. Tant qu'il n'est pas branche,
// la page affiche la commande manuelle equivalente.
const ENDPOINT = import.meta.env.VITE_PUBLISH_ENDPOINT as string | undefined;

export default function Publish() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const publish = async () => {
    if (!ENDPOINT) return;
    setState('sending'); setMsg('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      setState('done');
      setMsg('Reconstruction lancée. Le site public sera à jour dans ~1 minute.');
    } catch (e) {
      setState('error');
      setMsg(e instanceof Error ? e.message : 'Échec du déclenchement.');
    }
  };

  return (
    <>
      <div className="topbar"><h1>Publier le site</h1></div>
      <div className="content">
        <div className="panel">
          <p className="panel-title">Mettre en ligne les modifications</p>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 0 }}>
            Tes éditions de contenu sont enregistrées en <strong>brouillon</strong> dans la base.
            Le site public ne change qu'au clic ci-dessous : il reconstruit les pages avec les
            dernières données et redéploie (~1 minute). Les demandes de booking, elles, arrivent
            en temps réel sans publication.
          </p>

          {ENDPOINT ? (
            <button className="btn btn-primary" disabled={state === 'sending'} onClick={publish}>
              {state === 'sending' ? 'Lancement…' : '🚀 Publier maintenant'}
            </button>
          ) : (
            <div className="banner warn">
              Déclencheur de publication pas encore configuré (voir checklist d'installation).
              En attendant, la publication se fait manuellement&nbsp;:
              <code style={{ marginLeft: 6 }}>npm run build &amp;&amp; firebase deploy --only hosting</code>
            </div>
          )}

          {msg && <p style={{ marginTop: '1rem', color: state === 'error' ? 'var(--danger)' : 'var(--accent)' }}>{msg}</p>}
        </div>
      </div>
    </>
  );
}
