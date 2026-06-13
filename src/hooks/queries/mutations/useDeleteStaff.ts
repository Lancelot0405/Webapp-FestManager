import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiDeleteStaff } from '../../../services/api/staff';
import { useToast } from '../../../context/ToastContext';
import type { StaffMember } from '../../../types';

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (staffId: number) => apiDeleteStaff(staffId),
    onMutate: async (staffId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKeys.staff);
      queryClient.setQueryData<StaffMember[]>(queryKeys.staff, (old) =>
        old?.filter(s => s.id !== staffId) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.staff, context.previous);
      showToast(`Lỗi khi xóa nhân viên: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}
