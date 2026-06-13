import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiAddStaffToEvent } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent, StaffRef } from '../../../types';

interface AddStaffPayload {
  eventId: number;
  staffRef: StaffRef;
}

export function useAddStaffToEvent() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ eventId, staffRef }: AddStaffPayload) =>
      apiAddStaffToEvent(eventId, staffRef.id),
    onMutate: async ({ eventId, staffRef }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) =>
        old?.map(e => {
          if (e.id !== eventId) return e;
          const alreadyIn = e.staff.some(s => s.id === staffRef.id);
          if (alreadyIn) return e;
          return { ...e, staff: [...e.staff, staffRef] };
        }) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi thêm nhân viên vào sự kiện: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
