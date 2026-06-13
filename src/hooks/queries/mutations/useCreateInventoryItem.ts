import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiCreateInventoryItem } from '../../../services/api/inventory';
import { useToast } from '../../../context/ToastContext';
import type { InventoryItem } from '../../../types';

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (item: Omit<InventoryItem, 'id'>) => apiCreateInventoryItem(item),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory });
      const previous = queryClient.getQueryData<InventoryItem[]>(queryKeys.inventory);
      const optimistic: InventoryItem = { ...item, id: Date.now() };
      queryClient.setQueryData<InventoryItem[]>(queryKeys.inventory, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.inventory, context.previous);
      showToast(`Lỗi khi tạo mặt hàng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}
