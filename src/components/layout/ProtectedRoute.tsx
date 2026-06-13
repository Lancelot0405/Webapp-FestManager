import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  return canView ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
