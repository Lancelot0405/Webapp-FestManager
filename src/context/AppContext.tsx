// =============================================================================
// FESTMANAGER — GLOBAL STATE MANAGEMENT
// src/context/AppContext.tsx
// =============================================================================

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import { useToast } from './ToastContext';

import type {
  CurrentUser,
  FestivalEvent,
  InventoryItem,
  InventoryLogEntry,
  StaffMember,
  Expense,
  ExpenseStatus,
  InventoryUnit,
  Client,
} from '../types';

import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  fetchStaff,
  fetchEvents,
  fetchInventory,
  fetchInventoryLogs,
  fetchClients,
  fetchPendingRegistrations,
  toISODate,
} from '../lib/db';
import { appReducer, initialState, type AppState } from './appReducer';


// =============================================================================
// 4. TẠO CONTEXT
// =============================================================================

interface AppContextValue {
  state: AppState;

  // --- Auth ---
  login:  (user: CurrentUser) => void;
  logout: () => void;

  // --- Events ---
  addEvent:    (event: FestivalEvent)  => void;
  updateEvent: (event: FestivalEvent)  => void;
  deleteEvent: (eventId: number)       => void;

  // --- Staff in event ---
  addStaffToEvent:      (eventId: number, staffRef: FestivalEvent['staff'][0]) => void;
  removeStaffFromEvent: (eventId: number, staffId: number)                     => void;

  // --- Expenses ---
  addExpense:           (eventId: number, expense: Expense)                              => void;
  updateExpenseStatus:  (eventId: number, expenseId: number, status: ExpenseStatus)      => void;

  // --- Inventory ---
  setInventoryItem:     (itemId: number, qty: number)                    => void;
  createInventoryItem:  (item: Omit<InventoryItem, 'id'>)                => void;
  deleteInventoryItem:  (itemId: number)                                 => void;
  updateInventoryUnit:  (itemId: number, unit: InventoryUnit)            => void;
  updateInventoryItem:  (itemId: number, name: string, current: number, threshold: number, unit: InventoryUnit) => void;
  addInventoryLog:      (log: InventoryLogEntry)                         => void;

  // --- HR ---
  addStaff:     (staff: StaffMember, userId?: string)                    => void;
  updateStaff:  (staff: StaffMember)                                     => void;
  deleteStaff:  (staffId: number)                                        => void;
  addContract:  (staffId: number, contract: StaffMember['contracts'][0]) => void;

  // --- Events (clone) ---
  cloneEvent: (event: FestivalEvent) => void;

  // --- Clients ---
  addClient:    (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: number) => void;

  // --- Registration Requests ---
  approveRegistration: (userId: string) => void;
  rejectRegistration:  (userId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// =============================================================================
// 5. PROVIDER
// =============================================================================

// Kết quả tối thiểu mà mọi truy vấn ghi của Supabase trả về.
type WriteResult = PromiseLike<{ error: { message: string } | null }>;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const showToast = useToast();

  // ---------------------------------------------------------------------------
  // Helper xử lý lỗi mutation tập trung.
  // Thay cho các lệnh `.then()` fire-and-forget không bắt lỗi: nếu DB trả lỗi,
  // ghi log + hiện toast cho người dùng thay vì im lặng để state lệch DB.
  // ---------------------------------------------------------------------------
  const runWrite = useCallback(
    async (context: string, builder: WriteResult): Promise<boolean> => {
      try {
        const { error } = await builder;
        if (error) {
          console.error(`[${context}] Supabase error:`, error.message);
          showToast(`Lỗi khi lưu (${context}): ${error.message}`, 'error');
          return false;
        }
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`[${context}] Unexpected error:`, message);
        showToast(`Lỗi kết nối (${context})`, 'error');
        return false;
      }
    },
    [showToast]
  );

  // ---------------------------------------------------------------------------
  // Load real data from Supabase
  // ---------------------------------------------------------------------------
  async function loadData(role?: string) {
    const [staff, events, inventory, inventoryLogs, clients] = await Promise.all([
      fetchStaff(),
      fetchEvents(),
      fetchInventory(),
      fetchInventoryLogs(),
      fetchClients(),
    ]);

    const payload: Partial<AppState> = { staff, events, inventory, inventoryLogs, clients };
    dispatch({ type: 'INIT_DATA', payload });

    if (role === 'admin') {
      const pendingRegistrations = await fetchPendingRegistrations();
      dispatch({ type: 'SET_PENDING_REGISTRATIONS', payload: pendingRegistrations });
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Khôi phục profile từ bảng users
        const { data: profile } = await supabase
          .from('users').select('id, name, role, status').eq('id', session.user.id).single();
        if (profile) {
          // Chặn tài khoản pending/rejected tự động đăng nhập
          if (profile.status === 'pending' || profile.status === 'rejected') {
            await supabase.auth.signOut();
            return;
          }
          dispatch({ type: 'LOGIN', payload: { id: profile.id, name: profile.name, role: profile.role } });
          loadData(profile.role);
        } else {
          // Không tìm thấy profile (race condition khi đăng ký) — không cho login
          await supabase.auth.signOut();
        }
      } else {
        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'INIT_DATA', payload: { staff: [] } });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh khi user quay lại tab (bắt thay đổi từ Supabase dashboard)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && state.currentUser) {
        loadData(state.currentUser.role);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state.currentUser]);

  // ---------------------------------------------------------------------------
  // Supabase Realtime — tự động refresh khi dữ liệu thay đổi từ bất kỳ client
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel('festmanager-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, () => {
        fetchStaff().then(staff => dispatch({ type: 'INIT_DATA', payload: { staff } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents().then(events => dispatch({ type: 'INIT_DATA', payload: { events } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_staff' }, () => {
        fetchEvents().then(events => dispatch({ type: 'INIT_DATA', payload: { events } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchEvents().then(events => dispatch({ type: 'INIT_DATA', payload: { events } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchStaff().then(staff => dispatch({ type: 'INIT_DATA', payload: { staff } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        fetchInventory().then(inventory => dispatch({ type: 'INIT_DATA', payload: { inventory } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        fetchInventoryLogs().then(inventoryLogs => dispatch({ type: 'INIT_DATA', payload: { inventoryLogs } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        fetchClients().then(clients => dispatch({ type: 'INIT_DATA', payload: { clients } }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- Auth ---
  const login  = useCallback((user: CurrentUser) =>
    dispatch({ type: 'LOGIN', payload: user }), []);
  const logout = useCallback(() => {
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // --- Events ---
  const addEvent = useCallback(async (event: FestivalEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
    const { data, error } = await supabase.from('events').insert({
      name: event.name,
      date: toISODate(event.date),
      end_date: event.endDate ? toISODate(event.endDate) : null,
      location: event.location,
      status: event.status,
      income: event.financials.income,
      expenses: event.financials.expenses,
      inventory_reported: event.inventoryReported,
      booth: event.extra.booth,
      hygiene_permit: event.extra.hygienePermit,
      organizer_contact: event.extra.organizerContact,
    }).select('id').single();
    if (error) {
      console.error('[addEvent] Supabase insert error:', error.message, error.code, error.details);
      showToast(`Lỗi lưu sự kiện: ${error.message}`, 'error');
      return;
    }
    if (data?.id && data.id !== event.id) {
      dispatch({ type: 'UPDATE_EVENT_ID', payload: { localId: event.id, dbId: data.id } });
    }
  }, [showToast]);

  const deleteEvent = useCallback((eventId: number) => {
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
    runWrite('deleteEvent', supabase.from('events').delete().eq('id', eventId));
    runWrite('deleteEvent.staff', supabase.from('event_staff').delete().eq('event_id', eventId));
  }, [runWrite]);

  const updateEvent = useCallback((event: FestivalEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });
    runWrite('updateEvent', supabase.from('events').update({
      name: event.name,
      date: toISODate(event.date),
      end_date: event.endDate ? toISODate(event.endDate) : null,
      location: event.location,
      status: event.status,
      income: event.financials.income,
      expenses: event.financials.expenses,
      inventory_reported: event.inventoryReported,
      booth: event.extra.booth,
      hygiene_permit: event.extra.hygienePermit,
      organizer_contact: event.extra.organizerContact,
    }).eq('id', event.id));
  }, [runWrite]);

  // --- Staff in event ---
  const addStaffToEvent = useCallback(
    (eventId: number, staffRef: FestivalEvent['staff'][0]) => {
      dispatch({ type: 'ADD_STAFF_TO_EVENT', payload: { eventId, staffRef } });
      runWrite('addStaffToEvent', supabase.from('event_staff').insert({ event_id: eventId, staff_id: staffRef.id }));
    },
    [runWrite]
  );

  const removeStaffFromEvent = useCallback(
    (eventId: number, staffId: number) => {
      dispatch({ type: 'REMOVE_STAFF_FROM_EVENT', payload: { eventId, staffId } });
      runWrite('removeStaffFromEvent', supabase.from('event_staff').delete().eq('event_id', eventId).eq('staff_id', staffId));
    },
    [runWrite]
  );

  // --- Expenses ---
  const addExpense = useCallback(
    async (eventId: number, expense: Expense) => {
      dispatch({ type: 'ADD_EXPENSE', payload: { eventId, expense } });
      const { data, error } = await supabase.from('expenses').insert({
        staff_id: parseInt(String(expense.staffId), 10) || null,
        staff_name: expense.staffName,
        festival_id: expense.festivalId,
        type: expense.type,
        amount: expense.amount,
        date: toISODate(expense.date),
        image_url: expense.imageUrl,
        status: expense.status,
      }).select('id').single();
      if (error) {
        console.error('[addExpense] Supabase insert error:', error.message);
        showToast(`Lỗi khi lưu chi phí: ${error.message}`, 'error');
        return;
      }
      if (data?.id && data.id !== expense.id) {
        dispatch({ type: 'UPDATE_EXPENSE_ID', payload: { eventId, localId: expense.id, dbId: data.id } });
      }
    },
    [showToast]
  );

  const updateExpenseStatus = useCallback(
    (eventId: number, expenseId: number, status: ExpenseStatus) => {
      dispatch({ type: 'UPDATE_EXPENSE_STATUS', payload: { eventId, expenseId, status } });
      runWrite('updateExpenseStatus', supabase.from('expenses').update({ status }).eq('id', expenseId));
    },
    [runWrite]
  );

  // --- Inventory ---
  const setInventoryItem = useCallback(
    (itemId: number, qty: number) => {
      dispatch({ type: 'SET_INVENTORY_ITEM', payload: { itemId, qty } });
      runWrite('setInventoryItem', supabase.from('inventory_items').update({ current: qty }).eq('id', itemId));
    },
    [runWrite]
  );

  const createInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id'>) => {
      dispatch({ type: 'CREATE_INVENTORY_ITEM', payload: item });
      runWrite('createInventoryItem', supabase.from('inventory_items').insert({
        name: item.name,
        current: item.current,
        threshold: item.threshold,
        unit: item.unit,
        category: item.category ?? 'food',
      }));
    },
    [runWrite]
  );

  const deleteInventoryItem = useCallback((itemId: number) => {
    dispatch({ type: 'DELETE_INVENTORY_ITEM', payload: itemId });
    runWrite('deleteInventoryItem', supabase.from('inventory_items').delete().eq('id', itemId));
  }, [runWrite]);

  const updateInventoryUnit = useCallback(
    (itemId: number, unit: InventoryUnit) => {
      dispatch({ type: 'UPDATE_INVENTORY_UNIT', payload: { itemId, unit } });
      runWrite('updateInventoryUnit', supabase.from('inventory_items').update({ unit }).eq('id', itemId));
    },
    [runWrite]
  );

  const updateInventoryItem = useCallback(
    (itemId: number, name: string, current: number, threshold: number, unit: InventoryUnit) => {
      dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { itemId, name, current, threshold, unit } });
      runWrite('updateInventoryItem', supabase.from('inventory_items').update({ name, current, threshold, unit }).eq('id', itemId));
    },
    [runWrite]
  );

  const addInventoryLog = useCallback(
    (log: InventoryLogEntry) => {
      dispatch({ type: 'ADD_INVENTORY_LOG', payload: log });
      runWrite('addInventoryLog', supabase.from('inventory_logs').insert({
        item_id: log.itemId,
        item_name: log.itemName,
        qty: log.qty,
        unit: log.unit,
        action: log.action,
        festival_id: log.festivalId,
        festival_name: log.festivalName,
        timestamp: log.timestamp,
        submitted_by: log.submittedBy,
      }));
    },
    [runWrite]
  );

  // --- HR ---
  const addStaff = useCallback((staff: StaffMember, userId?: string) => {
    dispatch({ type: 'ADD_STAFF', payload: staff });
    runWrite('addStaff', supabase.from('staff_members').insert({
      name: staff.name,
      dob: staff.dob,
      city: staff.city,
      staff_type: staff.staffType,
      user_id: userId ?? null,
    }));
  }, [runWrite]);

  const deleteStaff = useCallback(async (staffId: number) => {
    // Tìm userId trước khi xóa để xóa cả auth user
    const member = (await supabase.from('staff_members').select('user_id').eq('id', staffId).single()).data;
    dispatch({ type: 'DELETE_STAFF', payload: staffId });
    await supabase.from('staff_members').delete().eq('id', staffId);
    if (member?.user_id) {
      await supabaseAdmin.auth.admin.deleteUser(member.user_id);
    }
  }, []);

  const updateStaff = useCallback((staff: StaffMember) => {
    dispatch({ type: 'UPDATE_STAFF', payload: staff });
    runWrite('updateStaff', supabase.from('staff_members').update({
      name:                    staff.name,
      dob:                     staff.dob,
      city:                    staff.city,
      phone:                   staff.phone ?? null,
      staff_type:              staff.staffType,
      carte_vitale_url:        staff.carteVitale?.url        ?? null,
      carte_vitale_name:       staff.carteVitale?.fileName   ?? null,
      carte_vitale_uploaded_at:staff.carteVitale?.uploadedAt ?? null,
      carte_vitale_number:     staff.carteVitaleNumber       ?? null,
      titre_sejour_url:        staff.titreSejour?.url        ?? null,
      titre_sejour_name:       staff.titreSejour?.fileName   ?? null,
      titre_sejour_uploaded_at:staff.titreSejour?.uploadedAt ?? null,
      titre_sejour_number:     staff.titreSejeurNumber       ?? null,
    }).eq('id', staff.id));
  }, [runWrite]);

  const addContract = useCallback(
    (staffId: number, contract: StaffMember['contracts'][0]) => {
      dispatch({ type: 'ADD_CONTRACT', payload: { staffId, contract } });
      runWrite('addContract', supabase.from('contracts').insert({
        staff_id: staffId,
        date: toISODate(contract.date),
        url: contract.url,
        file_name: contract.fileName,
        festival_id: contract.festivalId ?? null,
      }));
    },
    [runWrite]
  );

  // --- Clone Event ---
  const cloneEvent = useCallback((event: FestivalEvent) => {
    const cloned: FestivalEvent = {
      ...event,
      id: Date.now(),
      name: `${event.name} (bản sao)`,
      status: 'Lên kế hoạch',
      receipts: [],
      inventoryReported: [],
      financials: { ...event.financials, income: 0 },
    };
    dispatch({ type: 'ADD_EVENT', payload: cloned });
    supabase.from('events').insert({
      name: cloned.name,
      date: toISODate(cloned.date),
      end_date: cloned.endDate ? toISODate(cloned.endDate) : null,
      location: cloned.location,
      status: cloned.status,
      income: 0,
      expenses: cloned.financials.expenses,
      inventory_reported: [],
      booth: cloned.extra.booth,
      hygiene_permit: cloned.extra.hygienePermit,
      organizer_contact: cloned.extra.organizerContact,
    }).select('id').single().then(({ data, error }) => {
      if (error) {
        console.error('[cloneEvent] Supabase insert error:', error.message);
        showToast(`Lỗi khi nhân bản sự kiện: ${error.message}`, 'error');
        return;
      }
      if (data?.id && data.id !== cloned.id) {
        dispatch({ type: 'UPDATE_EVENT_ID', payload: { localId: cloned.id, dbId: data.id } });
      }
    });
  }, [showToast]);

  // --- Clients ---
  const addClient = useCallback((client: Client) => {
    dispatch({ type: 'ADD_CLIENT', payload: client });
    runWrite('addClient', supabase.from('clients').insert({
      name: client.name,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notes: client.notes,
      event_ids: client.eventIds,
    }));
  }, [runWrite]);

  const updateClient = useCallback((client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
    runWrite('updateClient', supabase.from('clients').update({
      name: client.name,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notes: client.notes,
      event_ids: client.eventIds,
    }).eq('id', client.id));
  }, [runWrite]);

  const deleteClient = useCallback((clientId: number) => {
    dispatch({ type: 'DELETE_CLIENT', payload: clientId });
    runWrite('deleteClient', supabase.from('clients').delete().eq('id', clientId));
  }, [runWrite]);

  // --- Registration Requests ---
  const approveRegistration = useCallback(async (userId: string) => {
    await supabase.from('users').update({ status: 'active' }).eq('id', userId);
    dispatch({ type: 'REMOVE_PENDING_REGISTRATION', payload: userId });
  }, []);

  const rejectRegistration = useCallback(async (userId: string) => {
    // Xóa hẳn auth user để họ có thể đăng ký lại nếu muốn
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabase.from('users').delete().eq('id', userId);
    dispatch({ type: 'REMOVE_PENDING_REGISTRATION', payload: userId });
  }, []);

  // Memo hóa context value: chỉ tạo object mới khi `state` (hoặc một callback) đổi,
  // tránh re-render thừa ở mọi consumer khi component cha render lại vì lý do khác.
  const value: AppContextValue = useMemo(() => ({
    state,
    login, logout,
    addEvent, updateEvent, deleteEvent,
    addStaffToEvent, removeStaffFromEvent,
    addExpense, updateExpenseStatus,
    setInventoryItem, createInventoryItem, deleteInventoryItem, updateInventoryUnit, updateInventoryItem, addInventoryLog,
    addStaff, updateStaff, deleteStaff, addContract,
    cloneEvent,
    addClient, updateClient, deleteClient,
    approveRegistration, rejectRegistration,
  }), [
    state,
    login, logout,
    addEvent, updateEvent, deleteEvent,
    addStaffToEvent, removeStaffFromEvent,
    addExpense, updateExpenseStatus,
    setInventoryItem, createInventoryItem, deleteInventoryItem, updateInventoryUnit, updateInventoryItem, addInventoryLog,
    addStaff, updateStaff, deleteStaff, addContract,
    cloneEvent,
    addClient, updateClient, deleteClient,
    approveRegistration, rejectRegistration,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// =============================================================================
// 6. CUSTOM HOOK
// =============================================================================

// Hook đặt cùng file với context là chủ đích; chỉ ảnh hưởng HMR (dev), không
// ảnh hưởng production. Tách ra file riêng sẽ kéo theo sửa import ở rất nhiều nơi.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp() phải được dùng bên trong <AppProvider>.');
  }
  return ctx;
}

export type { AppState };
