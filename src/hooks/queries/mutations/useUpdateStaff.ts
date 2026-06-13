import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiUpdateStaff } from '../../../services/api/staff';
import { useToast } from '../../../context/ToastContext';
import type { StaffMember } from '../../../types';

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: (staff: StaffMember) => apiUpdateStaff(staff),
    onMutate: async (staff) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKeys.staff);
      queryClient.setQueryData<StaffMember[]>(queryKeys.staff, (old) =>
        old?.map(s => s.id === staff.id ? staff : s) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.staff, context.previous);
      showToast(`Lỗi khi cập nhật nhân viên: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}
