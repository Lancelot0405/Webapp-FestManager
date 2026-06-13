import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiDeleteInventoryItem } from '../../../services/api/inventory';
import { useToast } from '../../../context/ToastContext';
import type { InventoryItem } from '../../../types';

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (itemId: number) => apiDeleteInventoryItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory });
      const previous = queryClient.getQueryData<InventoryItem[]>(queryKeys.inventory);
      queryClient.setQueryData<InventoryItem[]>(queryKeys.inventory, (old) =>
        old?.filter(item => item.id !== itemId) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.inventory, context.previous);
      showToast(`Lỗi khi xóa mặt hàng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}
