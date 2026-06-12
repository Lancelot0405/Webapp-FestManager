import { useQuery } from '@tanstack/react-query';
import { fetchPendingRegistrations } from '../../services/api/staff';

export function usePendingRegistrationsQuery(enabled = false) {
  return useQuery({
    queryKey: ['pendingRegistrations'],
    queryFn: fetchPendingRegistrations,
    enabled,
  });
}
