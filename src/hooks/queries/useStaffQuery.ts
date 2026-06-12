import { useQuery } from '@tanstack/react-query';
import { fetchStaff } from '../../services/api/staff';

export function useStaffQuery() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff,
  });
}
