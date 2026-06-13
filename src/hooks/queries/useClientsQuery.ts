import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchClients } from '../../lib/db';

export function useClientsQuery() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: fetchClients,
  });
}
