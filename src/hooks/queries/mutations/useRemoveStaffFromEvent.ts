import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiRemoveStaffFromEvent } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent } from '../../../types';

interface RemoveStaffPayload {
  eventId: number;
  staffId: number;
}

export function useRemoveStaffFromEvent() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ eventId, staffId }: RemoveStaffPayload) =>
      apiRemoveStaffFromEvent(eventId, staffId),
    onMutate: async ({ eventId, staffId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) =>
        old?.map(e => {
          if (e.id !== eventId) return e;
          return { ...e, staff: e.staff.filter(s => s.id !== staffId) };
        }) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi xóa nhân viên khỏi sự kiện: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
