import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'marco-admin-theme';

function getInitial(): Theme {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* stockage indisponible */ }
  }, [theme]);

  return (
    <button className="btn btn-ghost btn-sm" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
      {theme === 'dark' ? '☀ Mode clair' : '🌙 Mode sombre'}
    </button>
  );
}
