import type { AppContextValue } from '../../context/AppContext';
import type { AppState } from '../../context/appReducer';
import type { FestivalEvent, CurrentUser, InventoryItem, Expense } from '../../types';
import { vi } from 'vitest';

export const mockAdminUser: CurrentUser = {
  id: 'user-1',
  name: 'Admin Test',
  role: 'admin',
};

export const mockEvents: FestivalEvent[] = [
  {
    id: 1,
    name: 'Festival Mùa Hè',
    date: '15-07-2026',
    location: 'Paris',
    status: 'Lên kế hoạch',
    staff: [],
    financials: { income: 5000000, expenses: {} },
    inventoryReported: [],
    receipts: [],
    extra: { booth: '', hygienePermit: '', organizerContact: '' },
  },
  {
    id: 2,
    name: 'Hội Chợ Thu',
    date: '20-09-2026',
    location: 'Lyon',
    status: 'Đang diễn ra',
    staff: [],
    financials: { income: 3000000, expenses: {} },
    inventoryReported: [],
    receipts: [],
    extra: { booth: '', hygienePermit: '', organizerContact: '' },
  },
];

export const mockInventory: InventoryItem[] = [
  { id: 1, name: 'Gạo', current: 50, threshold: 10, unit: 'kg', category: 'food' },
  { id: 2, name: 'Máy xay', current: 2, threshold: 1, unit: 'cái', category: 'equipment' },
];

export const mockExpenses: Expense[] = [
  {
    id: 1,
    staffId: '101',
    staffName: 'Nguyễn Văn A',
    festivalId: 1,
    type: 'Uber/Taxi',
    amount: 150000,
    date: '15-07-2026',
    imageUrl: 'http://example.com/receipt.jpg',
    status: 'pending',
  },
];

export const mockState: AppState = {
  currentUser: mockAdminUser,
  events: mockEvents,
  inventory: mockInventory,
  inventoryLogs: [],
  staff: [],
  clients: [],
  pendingRegistrations: [],
  loading: false,
};

export const mockAppContextValue: AppContextValue = {
  state: mockState,
  login: vi.fn(),
  logout: vi.fn(),
  addEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  addStaffToEvent: vi.fn(),
  removeStaffFromEvent: vi.fn(),
  addExpense: vi.fn(),
  updateExpenseStatus: vi.fn(),
  setInventoryItem: vi.fn(),
  createInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
  updateInventoryUnit: vi.fn(),
  updateInventoryItem: vi.fn(),
  addInventoryLog: vi.fn(),
  addStaff: vi.fn(),
  updateStaff: vi.fn(),
  deleteStaff: vi.fn(),
  addContract: vi.fn(),
  cloneEvent: vi.fn(),
  addClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  approveRegistration: vi.fn(),
  rejectRegistration: vi.fn(),
};
