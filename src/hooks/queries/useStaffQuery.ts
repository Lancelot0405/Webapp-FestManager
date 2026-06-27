import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchStaff } from '../../services/api/staff';

export function useStaffQuery() {
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: fetchStaff,
  });
}
