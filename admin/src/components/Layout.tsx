import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, IS_EMULATOR } from '../firebase';
import { useAuth } from '../auth';
import ChangePassword from './ChangePassword';
import ThemeToggle from './ThemeToggle';
import {
  IconInbox, IconMusic, IconList, IconBriefcase, IconImage, IconUpload, IconExternalLink,
  IconCamera, IconRoute,
} from './icons';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://marco-site-2f9aa.web.app';

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
  { to: '/bookings', label: 'Demandes', Icon: IconInbox },
  { to: '/music', label: 'Violon', Icon: IconMusic },
  { to: '/composition', label: 'Composition', Icon: IconList },
  { to: '/model', label: 'Modèle', Icon: IconCamera },
  { to: '/parcours', label: 'Parcours', Icon: IconRoute },
  { to: '/booking-content', label: 'Booking', Icon: IconBriefcase },
  { to: '/media', label: 'Médias', Icon: IconImage },
  { to: '/publish', label: 'Publier', Icon: IconUpload },
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
              <l.Icon size={17} />{l.label}
              {l.to === '/bookings' && unread > 0 && <span className="badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <a className="btn btn-sm view-site" href={SITE_URL} target="_blank" rel="noreferrer">
          <IconExternalLink size={15} />Voir le site
        </a>

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
