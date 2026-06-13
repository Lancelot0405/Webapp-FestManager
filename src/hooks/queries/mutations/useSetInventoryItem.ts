import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiSetInventoryItem } from '../../../services/api/inventory';
import { useToast } from '../../../context/ToastContext';
import type { InventoryItem } from '../../../types';

interface SetInventoryPayload {
  itemId: number;
  qty: number;
}

export function useSetInventoryItem() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ itemId, qty }: SetInventoryPayload) => apiSetInventoryItem(itemId, qty),
    onMutate: async ({ itemId, qty }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory });
      const previous = queryClient.getQueryData<InventoryItem[]>(queryKeys.inventory);
      queryClient.setQueryData<InventoryItem[]>(queryKeys.inventory, (old) =>
        old?.map(item => item.id === itemId ? { ...item, current: qty } : item) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.inventory, context.previous);
      showToast(`Lỗi khi cập nhật số lượng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}
