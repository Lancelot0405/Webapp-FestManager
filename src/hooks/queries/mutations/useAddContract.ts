import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { apiAddContract } from '../../../services/api/staff';
import { useToast } from '../../../context/ToastContext';
import type { StaffMember } from '../../../types';

interface AddContractPayload {
  staffId: number;
  contract: StaffMember['contracts'][0];
}

export function useAddContract() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ staffId, contract }: AddContractPayload) => apiAddContract(staffId, contract),
    onMutate: async ({ staffId, contract }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff });
      const previous = queryClient.getQueryData<StaffMember[]>(queryKeys.staff);
      queryClient.setQueryData<StaffMember[]>(queryKeys.staff, (old) =>
        old?.map(s => s.id === staffId ? { ...s, contracts: [...s.contracts, contract] } : s) ?? []
      );
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.staff, context.previous);
      showToast(`Lỗi khi thêm hợp đồng: ${err.message}`, 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}
