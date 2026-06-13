import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiUpdateClient } from '../../../services/api/clients';
import { useToast } from '../../../context/ToastContext';
import type { Client } from '../../../types';

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (client: Client) => apiUpdateClient(client),
    onMutate: async (client) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });
      const previous = queryClient.getQueryData<Client[]>(queryKeys.clients);
      queryClient.setQueryData<Client[]>(queryKeys.clients, (old) =>
        old?.map(c => c.id === client.id ? client : c) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.clients, context.previous);
      showToast(`Lỗi khi cập nhật khách hàng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}
