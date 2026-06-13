import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiUpdateExpenseStatus } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent, ExpenseStatus } from '../../../types';

interface UpdateExpenseStatusPayload {
  eventId: number;
  expenseId: number;
  status: ExpenseStatus;
}

export function useUpdateExpenseStatus() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ expenseId, status }: UpdateExpenseStatusPayload) =>
      apiUpdateExpenseStatus(expenseId, status),
    onMutate: async ({ eventId, expenseId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) =>
        old?.map(e => e.id !== eventId ? e : {
          ...e,
          receipts: e.receipts.map(r => r.id !== expenseId ? r : { ...r, status }),
        }) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi cập nhật trạng thái chi phí: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
