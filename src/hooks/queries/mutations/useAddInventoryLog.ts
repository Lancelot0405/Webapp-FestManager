import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiAddInventoryLog } from '../../../services/api/inventory';
import { useToast } from '../../../context/ToastContext';
import type { InventoryLogEntry } from '../../../types';

export function useAddInventoryLog() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (log: InventoryLogEntry) => apiAddInventoryLog(log),
    onMutate: async (log) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.inventoryLogs });
      const previous = queryClient.getQueryData<InventoryLogEntry[]>(queryKeys.inventoryLogs);
      queryClient.setQueryData<InventoryLogEntry[]>(queryKeys.inventoryLogs, (old) => [log, ...(old ?? [])]);
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.inventoryLogs, context.previous);
      showToast(`Lỗi khi ghi nhật ký kho: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLogs });
    },
  });
}
