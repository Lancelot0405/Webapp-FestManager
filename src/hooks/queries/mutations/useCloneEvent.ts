import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiCloneEvent } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent } from '../../../types';

export function useCloneEvent() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (event: FestivalEvent) => apiCloneEvent(event),
    onMutate: async (event) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      const cloned: FestivalEvent = {
        ...event,
        id: Date.now(),
        name: `${event.name} (bản sao)`,
        status: 'Lên kế hoạch',
        receipts: [],
        inventoryReported: [],
        financials: { ...event.financials, income: 0 },
      };
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) => [...(old ?? []), cloned]);
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi nhân bản sự kiện: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
