import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import LoginScreen    from './components/layout/LoginScreen';
import Layout         from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

const Dashboard   = lazy(() => import('./components/dashboard/Dashboard'));
const Schedule    = lazy(() => import('./components/schedule/Schedule'));
const EventDetail = lazy(() => import('./components/schedule/EventDetail'));
const Inventory   = lazy(() => import('./components/inventory/Inventory'));
const Finance     = lazy(() => import('./components/finance/Finance'));
const HRGlobal    = lazy(() => import('./components/hr/HRGlobal'));
const StaffProfile = lazy(() => import('./components/hr/StaffProfile'));
const Clients     = lazy(() => import('./components/clients/Clients'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  const { state } = useApp();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-warm">
            <span className="text-white font-black text-xl tracking-tight">FM</span>
          </div>
          <div className="w-8 h-8 border-white/30 border-t-white rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-brand-gradient flex justify-center">
        <LoginScreen />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Lazy><Dashboard /></Lazy>} />
        <Route path="schedule"  element={<Lazy><Schedule /></Lazy>} />
        <Route path="schedule/:eventId" element={<Lazy><EventDetail /></Lazy>} />
        <Route path="inventory" element={<Lazy><Inventory /></Lazy>} />

        <Route path="finance" element={
          <ProtectedRoute><Lazy><Finance /></Lazy></ProtectedRoute>
        } />
        <Route path="hr" element={
          <ProtectedRoute><Lazy><HRGlobal /></Lazy></ProtectedRoute>
        } />
        <Route path="hr/:staffId" element={
          <ProtectedRoute><Lazy><StaffProfile /></Lazy></ProtectedRoute>
        } />

        <Route path="profile" element={<Lazy><StaffProfile /></Lazy>} />
        <Route path="clients" element={
          <ProtectedRoute><Lazy><Clients /></Lazy></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
