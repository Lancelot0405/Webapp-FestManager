import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiAddExpense } from '../../../services/api/events';
import { useToast } from '../../../context/ToastContext';
import type { FestivalEvent, Expense } from '../../../types';

interface AddExpensePayload {
  eventId: number;
  expense: Expense;
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ expense }: AddExpensePayload) => apiAddExpense(expense),
    onMutate: async ({ eventId, expense }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<FestivalEvent[]>(queryKeys.events);
      queryClient.setQueryData<FestivalEvent[]>(queryKeys.events, (old) =>
        old?.map(e => e.id !== eventId ? e : { ...e, receipts: [...e.receipts, expense] }) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.events, context.previous);
      showToast(`Lỗi khi lưu chi phí: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}
