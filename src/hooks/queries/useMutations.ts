import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as eventsApi from '../../services/api/events';
import * as staffApi from '../../services/api/staff';
import * as inventoryApi from '../../services/api/inventory';
import * as expensesApi from '../../services/api/expenses';
import * as clientsApi from '../../services/api/clients';
import type {
  FestivalEvent,
  StaffMember,
  Contract,
  InventoryItem,
  InventoryUnit,
  Expense,
  ExpenseStatus,
} from '../../types';

// --- Events ---
export function useCreateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useAddStaffToEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, staffId }: { eventId: number; staffId: number }) =>
      eventsApi.addStaffToEvent(eventId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useRemoveStaffFromEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, staffId }: { eventId: number; staffId: number }) =>
      eventsApi.removeStaffFromEvent(eventId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCloneEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.cloneEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// --- Staff & HR ---
export function useCreateStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staff, userId }: { staff: Omit<StaffMember, 'id' | 'contracts'>; userId?: string }) =>
      staffApi.createStaff(staff, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useUpdateStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.updateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useDeleteStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useAddContractMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, contract }: { staffId: number; contract: Omit<Contract, 'id'> }) =>
      staffApi.addContract(staffId, contract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useApproveRegistrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.approveRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useRejectRegistrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.rejectRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
    },
  });
}

// --- Inventory ---
export function useSetInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, qty }: { itemId: number; qty: number }) =>
      inventoryApi.setInventoryItem(itemId, qty),
    onMutate: async ({ itemId, qty }) => {
      await queryClient.cancelQueries({ queryKey: ['inventory'] });
      const previousInventory = queryClient.getQueryData<InventoryItem[]>(['inventory']);
      if (previousInventory) {
        queryClient.setQueryData<InventoryItem[]>(
          ['inventory'],
          previousInventory.map(item =>
            item.id === itemId ? { ...item, current: qty } : item
          )
        );
      }
      return { previousInventory };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(['inventory'], context.previousInventory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      name,
      current,
      threshold,
      unit,
    }: {
      itemId: number;
      name: string;
      current: number;
      threshold: number;
      unit: InventoryUnit;
    }) => inventoryApi.updateInventoryItem(itemId, name, current, threshold, unit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryUnitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, unit }: { itemId: number; unit: InventoryUnit }) =>
      inventoryApi.updateInventoryUnit(itemId, unit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useAddInventoryLogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.addInventoryLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'logs'] });
    },
  });
}

// --- Expenses ---
export function useAddExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, expense }: { eventId: number; expense: Omit<Expense, 'id'> }) =>
      expensesApi.addExpense(eventId, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateExpenseStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      expenseId,
      status,
    }: {
      eventId: number;
      expenseId: number;
      status: ExpenseStatus;
    }) => expensesApi.updateExpenseStatus(eventId, expenseId, status),
    onMutate: async ({ eventId, expenseId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previousEvents = queryClient.getQueryData<FestivalEvent[]>(['events']);
      if (previousEvents) {
        queryClient.setQueryData<FestivalEvent[]>(
          ['events'],
          previousEvents.map(event => {
            if (event.id === eventId) {
              return {
                ...event,
                receipts: event.receipts.map(receipt =>
                  receipt.id === expenseId ? { ...receipt, status } : receipt
                ),
              };
            }
            return event;
          })
        );
      }
      return { previousEvents };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['events'], context.previousEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// --- Clients ---
export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
