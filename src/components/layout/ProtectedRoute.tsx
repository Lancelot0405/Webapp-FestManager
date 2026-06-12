import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();
  const { currentUser } = state;

  const canView = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return canView ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
