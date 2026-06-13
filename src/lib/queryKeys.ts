export const queryKeys = {
  events: ['events'] as const,
  event: (id: number) => ['events', id] as const,
  staff: ['staff'] as const,
  staffMember: (id: number) => ['staff', id] as const,
  inventory: ['inventory'] as const,
  inventoryLogs: ['inventory', 'logs'] as const,
  clients: ['clients'] as const,
  pendingRegistrations: ['pendingRegistrations'] as const,
} as const;
