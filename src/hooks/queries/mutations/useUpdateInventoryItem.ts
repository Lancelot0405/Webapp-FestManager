import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiUpdateInventoryItem } from '../../../services/api/inventory';
import { useToast } from '../../../context/ToastContext';
import type { InventoryItem, InventoryUnit } from '../../../types';

interface UpdateInventoryItemPayload {
  itemId: number;
  name: string;
  current: number;
  threshold: number;
  unit: InventoryUnit;
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ itemId, name, current, threshold, unit }: UpdateInventoryItemPayload) =>
      apiUpdateInventoryItem(itemId, name, current, threshold, unit),
    onMutate: async ({ itemId, name, current, threshold, unit }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory });
      const previous = queryClient.getQueryData<InventoryItem[]>(queryKeys.inventory);
      queryClient.setQueryData<InventoryItem[]>(queryKeys.inventory, (old) =>
        old?.map(item => item.id === itemId ? { ...item, name, current, threshold, unit } : item) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.inventory, context.previous);
      showToast(`Lỗi khi cập nhật mặt hàng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}
