import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiUpdateInventoryUnit } from '../../../services/api/inventory';
import { useToast } from '../../../context/ToastContext';
import type { InventoryItem, InventoryUnit } from '../../../types';

interface UpdateInventoryUnitPayload {
  itemId: number;
  unit: InventoryUnit;
}

export function useUpdateInventoryUnit() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ itemId, unit }: UpdateInventoryUnitPayload) => apiUpdateInventoryUnit(itemId, unit),
    onMutate: async ({ itemId, unit }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory });
      const previous = queryClient.getQueryData<InventoryItem[]>(queryKeys.inventory);
      queryClient.setQueryData<InventoryItem[]>(queryKeys.inventory, (old) =>
        old?.map(item => item.id === itemId ? { ...item, unit } : item) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.inventory, context.previous);
      showToast(`Lỗi khi cập nhật đơn vị: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}
