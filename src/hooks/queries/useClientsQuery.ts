import { useQuery } from '@tanstack/react-query';
import { fetchClients } from '../../services/api/clients';

export function useClientsQuery() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });
}
