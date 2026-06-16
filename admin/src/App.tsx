import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login from './components/Login';
import Bookings from './pages/Bookings';
import Music from './pages/Music';
import Composition from './pages/Composition';
import BookingContent from './pages/BookingContent';
import Media from './pages/Media';
import Publish from './pages/Publish';

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-page">Chargement…</div>;
  if (!user) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/bookings" replace />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/music" element={<Music />} />
        <Route path="/composition" element={<Composition />} />
        <Route path="/booking-content" element={<BookingContent />} />
        <Route path="/media" element={<Media />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="*" element={<Navigate to="/bookings" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
