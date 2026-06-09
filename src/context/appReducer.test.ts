import { describe, it, expect } from 'vitest';
import { appReducer, initialState, type AppState } from './appReducer';
import type { FestivalEvent, StaffMember, Expense, InventoryItem, Client } from '../types';

// --- Fixtures tối thiểu --------------------------------------------------------
function makeEvent(over: Partial<FestivalEvent> = {}): FestivalEvent {
  return {
    id: 1,
    name: 'Sự kiện A',
    date: '01-06-2026',
    location: 'Paris',
    status: 'Lên kế hoạch',
    staff: [],
    financials: { income: 0, expenses: {} },
    inventoryReported: [],
    receipts: [],
    extra: { booth: '', hygienePermit: '', organizerContact: '' },
    ...over,
  };
}
function makeStaff(over: Partial<StaffMember> = {}): StaffMember {
  return { id: 1, name: 'NV A', dob: '', city: 'Paris', staffType: 'permanent', contracts: [], ...over };
}
function makeExpense(over: Partial<Expense> = {}): Expense {
  return { id: 1, staffId: '1', staffName: 'NV A', festivalId: 1, type: 'Ăn uống', amount: 10, date: '01-06-2026', imageUrl: '', status: 'pending', ...over };
}
function makeItem(over: Partial<InventoryItem> = {}): InventoryItem {
  return { id: 1, name: 'Gạo', current: 5, threshold: 2, unit: 'kg', category: 'food', ...over };
}
function makeClient(over: Partial<Client> = {}): Client {
  return { id: 1, name: 'Đối tác A', contactName: '', phone: '', email: '', city: '', notes: '', eventIds: [], ...over };
}

describe('appReducer — tính bất biến', () => {
  it('không đột biến state gốc', () => {
    const snapshot = JSON.stringify(initialState);
    appReducer(initialState, { type: 'ADD_EVENT', payload: makeEvent() });
    expect(JSON.stringify(initialState)).toBe(snapshot);
  });

  it('action lạ → trả nguyên state', () => {
    // @ts-expect-error test action không tồn tại
    expect(appReducer(initialState, { type: 'UNKNOWN' })).toBe(initialState);
  });
});

describe('appReducer — auth', () => {
  it('LOGIN gán currentUser', () => {
    const s = appReducer(initialState, { type: 'LOGIN', payload: { id: 'u1', name: 'Admin', role: 'admin' } });
    expect(s.currentUser).toEqual({ id: 'u1', name: 'Admin', role: 'admin' });
  });
  it('LOGOUT xóa currentUser', () => {
    const loggedIn: AppState = { ...initialState, currentUser: { id: 'u1', name: 'A', role: 'admin' } };
    expect(appReducer(loggedIn, { type: 'LOGOUT' }).currentUser).toBeNull();
  });
});

describe('appReducer — events', () => {
  it('ADD_EVENT thêm sự kiện', () => {
    const s = appReducer(initialState, { type: 'ADD_EVENT', payload: makeEvent() });
    expect(s.events).toHaveLength(1);
  });

  it('UPDATE_EVENT thay đúng sự kiện theo id', () => {
    const base: AppState = { ...initialState, events: [makeEvent({ id: 1 }), makeEvent({ id: 2, name: 'B' })] };
    const s = appReducer(base, { type: 'UPDATE_EVENT', payload: makeEvent({ id: 2, name: 'B đã sửa' }) });
    expect(s.events.find(e => e.id === 2)?.name).toBe('B đã sửa');
    expect(s.events.find(e => e.id === 1)?.name).toBe('Sự kiện A');
  });

  it('UPDATE_EVENT_ID đổi id tạm sang id thật', () => {
    const base: AppState = { ...initialState, events: [makeEvent({ id: 999 })] };
    const s = appReducer(base, { type: 'UPDATE_EVENT_ID', payload: { localId: 999, dbId: 42 } });
    expect(s.events[0].id).toBe(42);
  });

  it('DELETE_EVENT xóa đúng sự kiện', () => {
    const base: AppState = { ...initialState, events: [makeEvent({ id: 1 }), makeEvent({ id: 2 })] };
    const s = appReducer(base, { type: 'DELETE_EVENT', payload: 1 });
    expect(s.events.map(e => e.id)).toEqual([2]);
  });
});

describe('appReducer — staff trong event', () => {
  it('ADD_STAFF_TO_EVENT thêm staff, không trùng lặp', () => {
    const base: AppState = { ...initialState, events: [makeEvent({ id: 1 })] };
    const ref = { id: 7, name: 'NV', city: 'Lyon' };
    let s = appReducer(base, { type: 'ADD_STAFF_TO_EVENT', payload: { eventId: 1, staffRef: ref } });
    s = appReducer(s, { type: 'ADD_STAFF_TO_EVENT', payload: { eventId: 1, staffRef: ref } });
    expect(s.events[0].staff).toHaveLength(1);
  });

  it('REMOVE_STAFF_FROM_EVENT gỡ staff', () => {
    const base: AppState = { ...initialState, events: [makeEvent({ id: 1, staff: [{ id: 7, name: 'NV', city: 'Lyon' }] })] };
    const s = appReducer(base, { type: 'REMOVE_STAFF_FROM_EVENT', payload: { eventId: 1, staffId: 7 } });
    expect(s.events[0].staff).toHaveLength(0);
  });
});

describe('appReducer — expenses', () => {
  it('ADD_EXPENSE rồi UPDATE_EXPENSE_STATUS', () => {
    const base: AppState = { ...initialState, events: [makeEvent({ id: 1 })] };
    let s = appReducer(base, { type: 'ADD_EXPENSE', payload: { eventId: 1, expense: makeExpense({ id: 5 }) } });
    expect(s.events[0].receipts).toHaveLength(1);
    s = appReducer(s, { type: 'UPDATE_EXPENSE_STATUS', payload: { eventId: 1, expenseId: 5, status: 'approved' } });
    expect(s.events[0].receipts[0].status).toBe('approved');
  });
});

describe('appReducer — inventory', () => {
  it('SET_INVENTORY_ITEM cập nhật số lượng', () => {
    const base: AppState = { ...initialState, inventory: [makeItem({ id: 1, current: 5 })] };
    const s = appReducer(base, { type: 'SET_INVENTORY_ITEM', payload: { itemId: 1, qty: 99 } });
    expect(s.inventory[0].current).toBe(99);
  });

  it('DELETE_INVENTORY_ITEM xóa mặt hàng', () => {
    const base: AppState = { ...initialState, inventory: [makeItem({ id: 1 }), makeItem({ id: 2 })] };
    const s = appReducer(base, { type: 'DELETE_INVENTORY_ITEM', payload: 1 });
    expect(s.inventory.map(i => i.id)).toEqual([2]);
  });

  it('ADD_INVENTORY_LOG chèn log mới nhất lên đầu', () => {
    const base: AppState = {
      ...initialState,
      inventoryLogs: [{ id: 1, itemId: 1, itemName: 'Gạo', qty: 1, unit: 'kg', action: 'set', festivalId: null, festivalName: '', timestamp: '', submittedBy: '' }],
    };
    const s = appReducer(base, { type: 'ADD_INVENTORY_LOG', payload: { id: 2, itemId: 1, itemName: 'Gạo', qty: 2, unit: 'kg', action: 'set', festivalId: null, festivalName: '', timestamp: '', submittedBy: '' } });
    expect(s.inventoryLogs.map(l => l.id)).toEqual([2, 1]);
  });
});

describe('appReducer — clients', () => {
  it('ADD / UPDATE / DELETE_CLIENT', () => {
    let s = appReducer(initialState, { type: 'ADD_CLIENT', payload: makeClient({ id: 1 }) });
    expect(s.clients).toHaveLength(1);
    s = appReducer(s, { type: 'UPDATE_CLIENT', payload: makeClient({ id: 1, name: 'Đã sửa' }) });
    expect(s.clients[0].name).toBe('Đã sửa');
    s = appReducer(s, { type: 'DELETE_CLIENT', payload: 1 });
    expect(s.clients).toHaveLength(0);
  });
});

describe('appReducer — staff (HR)', () => {
  it('ADD / UPDATE / DELETE_STAFF', () => {
    let s = appReducer(initialState, { type: 'ADD_STAFF', payload: makeStaff({ id: 1 }) });
    expect(s.staff).toHaveLength(1);
    s = appReducer(s, { type: 'UPDATE_STAFF', payload: makeStaff({ id: 1, name: 'Đổi tên' }) });
    expect(s.staff[0].name).toBe('Đổi tên');
    s = appReducer(s, { type: 'DELETE_STAFF', payload: 1 });
    expect(s.staff).toHaveLength(0);
  });

  it('ADD_CONTRACT gắn hợp đồng vào đúng nhân viên', () => {
    const base: AppState = { ...initialState, staff: [makeStaff({ id: 1 })] };
    const s = appReducer(base, { type: 'ADD_CONTRACT', payload: { staffId: 1, contract: { id: 10, date: '01-06-2026', url: 'x' } } });
    expect(s.staff[0].contracts).toHaveLength(1);
  });
});

describe('appReducer — registrations', () => {
  it('REMOVE_PENDING_REGISTRATION lọc theo id', () => {
    const base: AppState = {
      ...initialState,
      pendingRegistrations: [
        { id: 'a', userId: 'a', username: '', displayName: '', requestedRole: 'manager', status: 'pending', createdAt: '' },
        { id: 'b', userId: 'b', username: '', displayName: '', requestedRole: 'manager', status: 'pending', createdAt: '' },
      ],
    };
    const s = appReducer(base, { type: 'REMOVE_PENDING_REGISTRATION', payload: 'a' });
    expect(s.pendingRegistrations.map(r => r.id)).toEqual(['b']);
  });
});
