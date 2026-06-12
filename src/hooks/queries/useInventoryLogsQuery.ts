import { useQuery } from '@tanstack/react-query';
import { fetchInventoryLogs } from '../../services/api/inventory';

export function useInventoryLogsQuery() {
  return useQuery({
    queryKey: ['inventory', 'logs'],
    queryFn: fetchInventoryLogs,
  });
}
