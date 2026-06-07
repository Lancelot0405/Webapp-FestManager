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
  type ReactNode,
} from 'react';

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
  RegistrationRequest,
} from '../types';

import { supabase } from '../lib/supabase';
import {
  fetchStaff,
  fetchEvents,
  fetchInventory,
  fetchInventoryLogs,
  fetchClients,
  fetchPendingRegistrations,
  toISODate,
} from '../lib/db';

// =============================================================================
// 1. SHAPE CỦA GLOBAL STATE
// =============================================================================

interface AppState {
  currentUser:            CurrentUser | null;
  events:                 FestivalEvent[];
  inventory:              InventoryItem[];
  inventoryLogs:          InventoryLogEntry[];
  staff:                  StaffMember[];
  clients:                Client[];
  pendingRegistrations:   RegistrationRequest[];
  loading:                boolean;
}

const initialState: AppState = {
  currentUser:          null,
  events:               [],
  inventory:            [],
  inventoryLogs:        [],
  staff:                [],
  clients:              [],
  pendingRegistrations: [],
  loading:              true,
};

// =============================================================================
// 2. ĐỊNH NGHĨA TẤT CẢ ACTIONS
// =============================================================================

type Action =
  // --- Init from Supabase ---
  | { type: 'INIT_DATA'; payload: Partial<AppState> }

  // --- Auth ---
  | { type: 'LOGIN';  payload: CurrentUser }
  | { type: 'LOGOUT' }

  // --- Events ---
  | { type: 'ADD_EVENT';            payload: FestivalEvent }
  | { type: 'UPDATE_EVENT';         payload: FestivalEvent }
  | { type: 'UPDATE_EVENT_ID';      payload: { localId: number; dbId: number } }
  | { type: 'DELETE_EVENT';         payload: number }

  // --- Staff assignment (trong 1 event) ---
  | { type: 'ADD_STAFF_TO_EVENT';
      payload: { eventId: number; staffRef: FestivalEvent['staff'][0] } }
  | { type: 'REMOVE_STAFF_FROM_EVENT';
      payload: { eventId: number; staffId: number } }

  // --- Expenses ---
  | { type: 'ADD_EXPENSE';
      payload: { eventId: number; expense: Expense } }
  | { type: 'UPDATE_EXPENSE_ID';
      payload: { eventId: number; localId: number; dbId: number } }
  | { type: 'UPDATE_EXPENSE_STATUS';
      payload: { eventId: number; expenseId: number; status: ExpenseStatus } }

  // --- Inventory ---
  | { type: 'SET_INVENTORY_ITEM';
      payload: { itemId: number; qty: number } }
  | { type: 'CREATE_INVENTORY_ITEM';
      payload: Omit<InventoryItem, 'id'> }
  | { type: 'DELETE_INVENTORY_ITEM';
      payload: number }
  | { type: 'UPDATE_INVENTORY_UNIT';
      payload: { itemId: number; unit: InventoryUnit } }
  | { type: 'UPDATE_INVENTORY_ITEM';
      payload: { itemId: number; name: string; current: number; threshold: number; unit: InventoryUnit } }
  | { type: 'ADD_INVENTORY_LOG';
      payload: InventoryLogEntry }

  // --- HR / Staff profiles ---
  | { type: 'ADD_STAFF';            payload: StaffMember }
  | { type: 'UPDATE_STAFF';         payload: StaffMember }
  | { type: 'DELETE_STAFF';         payload: number }
  | { type: 'ADD_CONTRACT';
      payload: { staffId: number; contract: StaffMember['contracts'][0] } }

  // --- Clients ---
  | { type: 'ADD_CLIENT';    payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: number }

  // --- Registration Requests ---
  | { type: 'SET_PENDING_REGISTRATIONS'; payload: RegistrationRequest[] }
  | { type: 'REMOVE_PENDING_REGISTRATION'; payload: string };

// =============================================================================
// 3. REDUCER
// =============================================================================

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    // -------------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------------
    case 'INIT_DATA':
      return { ...state, ...action.payload, loading: false };

    // -------------------------------------------------------------------------
    // AUTH
    // -------------------------------------------------------------------------
    case 'LOGIN':
      return { ...state, currentUser: action.payload };

    case 'LOGOUT':
      return { ...state, currentUser: null };

    // -------------------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------------------
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };

    case 'UPDATE_EVENT_ID':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload.localId ? { ...e, id: action.payload.dbId } : e
        ),
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
      };

    // -------------------------------------------------------------------------
    // STAFF ASSIGNMENT (trong event)
    // -------------------------------------------------------------------------
    case 'ADD_STAFF_TO_EVENT':
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== action.payload.eventId) return e;
          const alreadyIn = e.staff.some(s => s.id === action.payload.staffRef.id);
          if (alreadyIn) return e;
          return { ...e, staff: [...e.staff, action.payload.staffRef] };
        }),
      };

    case 'REMOVE_STAFF_FROM_EVENT':
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== action.payload.eventId) return e;
          return {
            ...e,
            staff: e.staff.filter(s => s.id !== action.payload.staffId),
          };
        }),
      };

    // -------------------------------------------------------------------------
    // EXPENSES
    // -------------------------------------------------------------------------
    case 'ADD_EXPENSE':
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== action.payload.eventId) return e;
          return { ...e, receipts: [...e.receipts, action.payload.expense] };
        }),
      };

    case 'UPDATE_EXPENSE_ID':
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== action.payload.eventId) return e;
          return {
            ...e,
            receipts: e.receipts.map(r =>
              r.id === action.payload.localId ? { ...r, id: action.payload.dbId } : r
            ),
          };
        }),
      };

    case 'UPDATE_EXPENSE_STATUS':
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== action.payload.eventId) return e;
          return {
            ...e,
            receipts: e.receipts.map(r =>
              r.id === action.payload.expenseId
                ? { ...r, status: action.payload.status }
                : r
            ),
          };
        }),
      };

    // -------------------------------------------------------------------------
    // INVENTORY
    // -------------------------------------------------------------------------
    case 'SET_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.itemId
            ? { ...item, current: action.payload.qty }
            : item
        ),
      };

    case 'CREATE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: [
          ...state.inventory,
          { ...action.payload, id: Date.now() },
        ],
      };

    case 'DELETE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.filter(i => i.id !== action.payload),
      };

    case 'UPDATE_INVENTORY_UNIT':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.itemId
            ? { ...item, unit: action.payload.unit }
            : item
        ),
      };

    case 'UPDATE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.itemId
            ? { ...item, name: action.payload.name, current: action.payload.current, threshold: action.payload.threshold, unit: action.payload.unit }
            : item
        ),
      };

    case 'ADD_INVENTORY_LOG':
      return {
        ...state,
        inventoryLogs: [action.payload, ...state.inventoryLogs],
      };

    // -------------------------------------------------------------------------
    // HR
    // -------------------------------------------------------------------------
    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] };

    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(s =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter(s => s.id !== action.payload),
      };

    case 'ADD_CONTRACT':
      return {
        ...state,
        staff: state.staff.map(s => {
          if (s.id !== action.payload.staffId) return s;
          return {
            ...s,
            contracts: [...s.contracts, action.payload.contract],
          };
        }),
      };

    // -------------------------------------------------------------------------
    // CLIENTS
    // -------------------------------------------------------------------------
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== action.payload),
      };

    case 'SET_PENDING_REGISTRATIONS':
      return { ...state, pendingRegistrations: action.payload };

    case 'REMOVE_PENDING_REGISTRATION':
      return {
        ...state,
        pendingRegistrations: state.pendingRegistrations.filter(r => r.id !== action.payload),
      };

    default:
      return state;
  }
}

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [state.currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      alert(`Lỗi lưu sự kiện: ${error.message}`);
      return;
    }
    if (data?.id && data.id !== event.id) {
      dispatch({ type: 'UPDATE_EVENT_ID', payload: { localId: event.id, dbId: data.id } });
    }
  }, []);

  const deleteEvent = useCallback((eventId: number) => {
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
    supabase.from('events').delete().eq('id', eventId).then();
    supabase.from('event_staff').delete().eq('event_id', eventId).then();
  }, []);

  const updateEvent = useCallback((event: FestivalEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });
    supabase.from('events').update({
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
    }).eq('id', event.id).then();
  }, []);

  // --- Staff in event ---
  const addStaffToEvent = useCallback(
    (eventId: number, staffRef: FestivalEvent['staff'][0]) => {
      dispatch({ type: 'ADD_STAFF_TO_EVENT', payload: { eventId, staffRef } });
      supabase.from('event_staff').insert({ event_id: eventId, staff_id: staffRef.id }).then();
    },
    []
  );

  const removeStaffFromEvent = useCallback(
    (eventId: number, staffId: number) => {
      dispatch({ type: 'REMOVE_STAFF_FROM_EVENT', payload: { eventId, staffId } });
      supabase.from('event_staff').delete().eq('event_id', eventId).eq('staff_id', staffId).then();
    },
    []
  );

  // --- Expenses ---
  const addExpense = useCallback(
    async (eventId: number, expense: Expense) => {
      dispatch({ type: 'ADD_EXPENSE', payload: { eventId, expense } });
      const { data } = await supabase.from('expenses').insert({
        staff_id: parseInt(String(expense.staffId), 10) || null,
        staff_name: expense.staffName,
        festival_id: expense.festivalId,
        type: expense.type,
        amount: expense.amount,
        date: toISODate(expense.date),
        image_url: expense.imageUrl,
        status: expense.status,
      }).select('id').single();
      if (data?.id && data.id !== expense.id) {
        dispatch({ type: 'UPDATE_EXPENSE_ID', payload: { eventId, localId: expense.id, dbId: data.id } });
      }
    },
    []
  );

  const updateExpenseStatus = useCallback(
    (eventId: number, expenseId: number, status: ExpenseStatus) => {
      dispatch({ type: 'UPDATE_EXPENSE_STATUS', payload: { eventId, expenseId, status } });
      supabase.from('expenses').update({ status }).eq('id', expenseId).then();
    },
    []
  );

  // --- Inventory ---
  const setInventoryItem = useCallback(
    (itemId: number, qty: number) => {
      dispatch({ type: 'SET_INVENTORY_ITEM', payload: { itemId, qty } });
      supabase.from('inventory_items').update({ current: qty }).eq('id', itemId).then();
    },
    []
  );

  const createInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id'>) => {
      dispatch({ type: 'CREATE_INVENTORY_ITEM', payload: item });
      supabase.from('inventory_items').insert({
        name: item.name,
        current: item.current,
        threshold: item.threshold,
        unit: item.unit,
        category: item.category ?? 'food',
      }).then();
    },
    []
  );

  const deleteInventoryItem = useCallback((itemId: number) => {
    dispatch({ type: 'DELETE_INVENTORY_ITEM', payload: itemId });
    supabase.from('inventory_items').delete().eq('id', itemId).then();
  }, []);

  const updateInventoryUnit = useCallback(
    (itemId: number, unit: InventoryUnit) => {
      dispatch({ type: 'UPDATE_INVENTORY_UNIT', payload: { itemId, unit } });
      supabase.from('inventory_items').update({ unit }).eq('id', itemId).then();
    },
    []
  );

  const updateInventoryItem = useCallback(
    (itemId: number, name: string, current: number, threshold: number, unit: InventoryUnit) => {
      dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { itemId, name, current, threshold, unit } });
      supabase.from('inventory_items').update({ name, current, threshold, unit }).eq('id', itemId).then();
    },
    []
  );

  const addInventoryLog = useCallback(
    (log: InventoryLogEntry) => {
      dispatch({ type: 'ADD_INVENTORY_LOG', payload: log });
      supabase.from('inventory_logs').insert({
        item_id: log.itemId,
        item_name: log.itemName,
        qty: log.qty,
        unit: log.unit,
        action: log.action,
        festival_id: log.festivalId,
        festival_name: log.festivalName,
        timestamp: log.timestamp,
        submitted_by: log.submittedBy,
      }).then();
    },
    []
  );

  // --- HR ---
  const addStaff = useCallback((staff: StaffMember, userId?: string) => {
    dispatch({ type: 'ADD_STAFF', payload: staff });
    supabase.from('staff_members').insert({
      name: staff.name,
      dob: staff.dob,
      city: staff.city,
      staff_type: staff.staffType,
      user_id: userId ?? null,
    }).then();
  }, []);

  const deleteStaff = useCallback((staffId: number) => {
    dispatch({ type: 'DELETE_STAFF', payload: staffId });
    supabase.from('staff_members').delete().eq('id', staffId).then();
  }, []);

  const updateStaff = useCallback((staff: StaffMember) => {
    dispatch({ type: 'UPDATE_STAFF', payload: staff });
    supabase.from('staff_members').update({
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
    }).eq('id', staff.id).then();
  }, []);

  const addContract = useCallback(
    (staffId: number, contract: StaffMember['contracts'][0]) => {
      dispatch({ type: 'ADD_CONTRACT', payload: { staffId, contract } });
      supabase.from('contracts').insert({
        staff_id: staffId,
        date: toISODate(contract.date),
        url: contract.url,
        file_name: contract.fileName,
        festival_id: contract.festivalId ?? null,
      }).then();
    },
    []
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
    }).select('id').single().then(({ data }) => {
      if (data?.id && data.id !== cloned.id) {
        dispatch({ type: 'UPDATE_EVENT_ID', payload: { localId: cloned.id, dbId: data.id } });
      }
    });
  }, []);

  // --- Clients ---
  const addClient = useCallback((client: Client) => {
    dispatch({ type: 'ADD_CLIENT', payload: client });
    supabase.from('clients').insert({
      name: client.name,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notes: client.notes,
      event_ids: client.eventIds,
    }).then();
  }, []);

  const updateClient = useCallback((client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
    supabase.from('clients').update({
      name: client.name,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notes: client.notes,
      event_ids: client.eventIds,
    }).eq('id', client.id).then();
  }, []);

  const deleteClient = useCallback((clientId: number) => {
    dispatch({ type: 'DELETE_CLIENT', payload: clientId });
    supabase.from('clients').delete().eq('id', clientId).then();
  }, []);

  // --- Registration Requests ---
  const approveRegistration = useCallback(async (userId: string) => {
    await supabase.from('users').update({ status: 'active' }).eq('id', userId);
    dispatch({ type: 'REMOVE_PENDING_REGISTRATION', payload: userId });
  }, []);

  const rejectRegistration = useCallback(async (userId: string) => {
    await supabase.from('users').update({ status: 'rejected' }).eq('id', userId);
    dispatch({ type: 'REMOVE_PENDING_REGISTRATION', payload: userId });
  }, []);

  const value: AppContextValue = {
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// =============================================================================
// 6. CUSTOM HOOK
// =============================================================================

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp() phải được dùng bên trong <AppProvider>.');
  }
  return ctx;
}

export type { AppState };
