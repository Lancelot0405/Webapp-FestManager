import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchPendingRegistrations } from '../../lib/db';
import { useApp } from '../../context/AppContext';

export function usePendingRegistrationsQuery() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: queryKeys.pendingRegistrations,
    queryFn: fetchPendingRegistrations,
    enabled: currentUser?.role === 'admin',
  });
}
