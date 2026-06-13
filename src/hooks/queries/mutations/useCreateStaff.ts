import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiCreateStaff } from '../../../services/api/staff';
import { useToast } from '../../../context/ToastContext';
import type { StaffMember } from '../../../types';

interface CreateStaffPayload {
  staff: StaffMember;
  userId?: string;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ staff, userId }: CreateStaffPayload) => apiCreateStaff(staff, userId),
    onMutate: async ({ staff }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKeys.staff);
      queryClient.setQueryData<StaffMember[]>(queryKeys.staff, (old) => [...(old ?? []), staff]);
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.staff, context.previous);
      showToast(`Lỗi khi thêm nhân viên: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}
