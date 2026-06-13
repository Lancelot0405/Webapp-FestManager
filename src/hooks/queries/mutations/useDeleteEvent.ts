import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiDeleteEvent } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent } from '../../../types';

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (eventId: number) => apiDeleteEvent(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) =>
        old?.filter(e => e.id !== eventId) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi xóa sự kiện: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
