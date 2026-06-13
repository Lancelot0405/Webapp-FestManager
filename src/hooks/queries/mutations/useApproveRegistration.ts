import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiApproveRegistration } from '../../../services/api/clients';
import { useToast } from '../../../context/ToastContext';
import type { RegistrationRequest } from '../../../types';

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (userId: string) => apiApproveRegistration(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pendingRegistrations });
      const previous = queryClient.getQueryData<RegistrationRequest[]>(queryKeys.pendingRegistrations);
      queryClient.setQueryData<RegistrationRequest[]>(queryKeys.pendingRegistrations, (old) =>
        old?.filter(r => r.id !== userId) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.pendingRegistrations, context.previous);
      showToast(`Lỗi khi duyệt đăng ký: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingRegistrations });
    },
  });
}
