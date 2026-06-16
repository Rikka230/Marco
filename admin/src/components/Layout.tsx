import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, IS_EMULATOR } from '../firebase';
import { useAuth } from '../auth';
import ChangePassword from './ChangePassword';
import ThemeToggle from './ThemeToggle';

// Compteur temps reel des demandes non lues (badge sidebar).
function useUnreadCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const q = query(collection(db, 'bookings'), where('status', '==', 'nouveau'));
    return onSnapshot(q, (snap) => setN(snap.size), () => setN(0));
  }, []);
  return n;
}

const LINKS = [
  { to: '/bookings', label: 'Demandes', icon: '📥' },
  { to: '/music', label: 'Violon', icon: '🎻' },
  { to: '/composition', label: 'Composition', icon: '♪' },
  { to: '/booking-content', label: 'Booking', icon: '✦' },
  { to: '/media', label: 'Médias', icon: '🖼' },
  { to: '/publish', label: 'Publier', icon: '🚀' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const unread = useUnreadCount();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="dot" />MARCO · ADMIN</div>
        <nav className="nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span aria-hidden>{l.icon}</span>{l.label}
              {l.to === '/bookings' && unread > 0 && <span className="badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {IS_EMULATOR && <div className="banner warn" style={{ margin: 0 }}>Mode émulateur local</div>}
          <div className="who">{user?.email}</div>
          <ThemeToggle />
          <ChangePassword />
          <button className="btn btn-ghost btn-sm" onClick={() => logout()}>Se déconnecter</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
