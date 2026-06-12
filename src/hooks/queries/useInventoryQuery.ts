import { useQuery } from '@tanstack/react-query';
import { fetchInventory } from '../../services/api/inventory';

export function useInventoryQuery() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });
}
