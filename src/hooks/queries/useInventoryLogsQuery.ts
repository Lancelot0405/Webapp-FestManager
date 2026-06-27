import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchInventoryLogs } from '../../services/api/inventory';

export function useInventoryLogsQuery() {
  return useQuery({
    queryKey: queryKeys.inventoryLogs,
    queryFn: fetchInventoryLogs,
  });
}
