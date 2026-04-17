import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { GradesPage } from './pages/GradesPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ArchivesPage } from './pages/ArchivesPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { AuthPage } from './pages/AuthPage';
import { StudentPortal } from './pages/StudentPortal';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

const ProtectedRoute = ({ user }: { user: any }) => {
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
};

function App() {
  const { user, setUser, setSession } = useAppStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <Routes>
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
        <Route path="/portal/:roomId" element={<StudentPortal />} />
        
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="evaluations" element={<EvaluationsPage />} />
            <Route path="evaluations/room" element={<GradesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="archives" element={<ArchivesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="*" element={<div className="text-slate-900 p-8">Page Not Found</div>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
