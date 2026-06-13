import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiDeleteClient } from '../../../services/api/clients';
import { useToast } from '../../../context/ToastContext';
import type { Client } from '../../../types';

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (clientId: number) => apiDeleteClient(clientId),
    onMutate: async (clientId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });
      const previous = queryClient.getQueryData<Client[]>(queryKeys.clients);
      queryClient.setQueryData<Client[]>(queryKeys.clients, (old) =>
        old?.filter(c => c.id !== clientId) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.clients, context.previous);
      showToast(`Lỗi khi xóa khách hàng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}
