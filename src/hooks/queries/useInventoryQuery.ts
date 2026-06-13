import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchInventory } from '../../lib/db';

export function useInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: fetchInventory,
  });
}
