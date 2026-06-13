import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiCreateEvent } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent } from '../../../types';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (event: FestivalEvent) => apiCreateEvent(event),
    onMutate: async (event) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) => [...(old ?? []), event]);
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi tạo sự kiện: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
