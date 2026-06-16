import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

// Changement du mot de passe admin (dans la sidebar).
export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const inputStyle = {
    width: '100%', padding: '0.45rem 0.6rem', borderRadius: 8,
    border: '1px solid var(--line-strong)', background: 'var(--bg)',
    color: 'var(--text)', fontSize: '0.82rem',
  } as const;

  const save = async () => {
    setMsg(''); setOk(false);
    if (pwd.length < 8) { setMsg('8 caractères minimum.'); return; }
    if (pwd !== pwd2) { setMsg('Les deux mots de passe diffèrent.'); return; }
    if (!auth.currentUser) { setMsg('Session expirée, reconnecte-toi.'); return; }
    setBusy(true);
    try {
      await updatePassword(auth.currentUser, pwd);
      setOk(true); setMsg('Mot de passe mis à jour.');
      setPwd(''); setPwd2('');
      setTimeout(() => { setOpen(false); setMsg(''); setOk(false); }, 1600);
    } catch (e) {
      const code = (e as { code?: string }).code;
      setMsg(code === 'auth/requires-recent-login'
        ? 'Pour des raisons de sécurité, déconnecte-toi et reconnecte-toi, puis réessaie.'
        : 'Erreur : ' + ((e as Error).message ?? ''));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Changer le mot de passe
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <input type="password" autoComplete="new-password" placeholder="Nouveau mot de passe"
        value={pwd} onChange={(e) => setPwd(e.target.value)} style={inputStyle} />
      <input type="password" autoComplete="new-password" placeholder="Confirmer"
        value={pwd2} onChange={(e) => setPwd2(e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
          {busy ? '…' : 'Enregistrer'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setMsg(''); }}>
          Annuler
        </button>
      </div>
      {msg && (
        <div style={{ fontSize: '0.72rem', lineHeight: 1.3, color: ok ? 'var(--accent)' : 'var(--danger)' }}>
          {msg}
        </div>
      )}
    </div>
  );
}
