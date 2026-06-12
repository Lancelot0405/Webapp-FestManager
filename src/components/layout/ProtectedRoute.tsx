import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const canView = state.currentUser?.role === 'admin' || state.currentUser?.role === 'manager';
  return canView ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
