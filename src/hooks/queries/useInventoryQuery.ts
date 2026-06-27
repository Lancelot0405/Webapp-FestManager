import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchInventory } from '../../services/api/inventory';

export function useInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: fetchInventory,
  });
}
