import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import LoginScreen from './components/layout/LoginScreen';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageSkeleton from './components/shared/skeletons/PageSkeleton';

// Lazy load screens
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Schedule = lazy(() => import('./components/schedule/Schedule'));
const EventDetail = lazy(() => import('./components/schedule/EventDetail'));
const Inventory = lazy(() => import('./components/inventory/Inventory'));
const Finance = lazy(() => import('./components/finance/Finance'));
const HRGlobal = lazy(() => import('./components/hr/HRGlobal'));
const StaffProfile = lazy(() => import('./components/hr/StaffProfile'));
const Clients = lazy(() => import('./components/clients/Clients'));

function ProfileView() {
  const { state } = useApp();
  const { currentUser, staff } = state;

  const myStaffMember = currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;

  if (myStaffMember) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <StaffProfile staffId={String(myStaffMember.id)} />
      </Suspense>
    );
  }

  return <p className="text-center text-[var(--text-muted)] py-20 text-sm">Đang tải hồ sơ...</p>;
}

export default function App() {
  const { state } = useApp();
  const { currentUser, loading } = state;

  // ── Đang khởi tạo (chờ onAuthStateChange) → hiện splash screen ──────────
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-warm">
            <span className="text-white font-black text-xl tracking-tight">FM</span>
          </div>
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        </div>
      </div>
    );
  }

  // ── Chưa đăng nhập → hiện màn hình Login ──────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-brand-gradient flex justify-center">
        <LoginScreen />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Redirect / to /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Common screens */}
        <Route path="dashboard" element={
          <Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>
        } />
        <Route path="schedule" element={
          <Suspense fallback={<PageSkeleton />}><Schedule /></Suspense>
        } />
        <Route path="schedule/:eventId" element={
          <Suspense fallback={<PageSkeleton />}><EventDetail /></Suspense>
        } />
        <Route path="inventory" element={
          <Suspense fallback={<PageSkeleton />}><Inventory /></Suspense>
        } />
        
        {/* Protected screens (admin/manager only) */}
        <Route path="finance" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton />}><Finance /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="hr" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton />}><HRGlobal /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="hr/:staffId" element={
          <Suspense fallback={<PageSkeleton />}><StaffProfile /></Suspense>
        } />
        <Route path="clients" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton />}><Clients /></Suspense>
          </ProtectedRoute>
        } />
        
        {/* Profile tab */}
        <Route path="profile" element={<ProfileView />} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
