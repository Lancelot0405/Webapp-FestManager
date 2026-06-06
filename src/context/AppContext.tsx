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
} from '../types';

import {
  MOCK_EVENTS,
  MOCK_INVENTORY,
  MOCK_INVENTORY_LOGS,
  MOCK_STAFF,
} from '../data/mockData';

import { supabase } from '../lib/supabase';
import {
  fetchStaff,
  fetchEvents,
  fetchInventory,
  fetchInventoryLogs,
} from '../lib/db';

// =============================================================================
// 1. SHAPE CỦA GLOBAL STATE
// =============================================================================

interface AppState {
  currentUser:    CurrentUser | null;
  events:         FestivalEvent[];
  inventory:      InventoryItem[];
  inventoryLogs:  InventoryLogEntry[];
  staff:          StaffMember[];
  loading:        boolean;
}

const initialState: AppState = {
  currentUser:   null,
  events:        MOCK_EVENTS,
  inventory:     MOCK_INVENTORY,
  inventoryLogs: MOCK_INVENTORY_LOGS,
  staff:         MOCK_STAFF,
  loading:       true,
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
  | { type: 'UPDATE_INVENTORY_UNIT';
      payload: { itemId: number; unit: InventoryUnit } }
  | { type: 'ADD_INVENTORY_LOG';
      payload: InventoryLogEntry }

  // --- HR / Staff profiles ---
  | { type: 'ADD_STAFF';            payload: StaffMember }
  | { type: 'UPDATE_STAFF';         payload: StaffMember }
  | { type: 'ADD_CONTRACT';
      payload: { staffId: number; contract: StaffMember['contracts'][0] } };

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

    case 'UPDATE_INVENTORY_UNIT':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.itemId
            ? { ...item, unit: action.payload.unit }
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

  // --- Staff in event ---
  addStaffToEvent:      (eventId: number, staffRef: FestivalEvent['staff'][0]) => void;
  removeStaffFromEvent: (eventId: number, staffId: number)                     => void;

  // --- Expenses ---
  addExpense:           (eventId: number, expense: Expense)                              => void;
  updateExpenseStatus:  (eventId: number, expenseId: number, status: ExpenseStatus)      => void;

  // --- Inventory ---
  setInventoryItem:     (itemId: number, qty: number)                    => void;
  createInventoryItem:  (item: Omit<InventoryItem, 'id'>)                => void;
  updateInventoryUnit:  (itemId: number, unit: InventoryUnit)            => void;
  addInventoryLog:      (log: InventoryLogEntry)                         => void;

  // --- HR ---
  addStaff:     (staff: StaffMember)                                     => void;
  updateStaff:  (staff: StaffMember)                                     => void;
  addContract:  (staffId: number, contract: StaffMember['contracts'][0]) => void;
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
  async function loadData() {
    const [staff, events, inventory, inventoryLogs] = await Promise.all([
      fetchStaff(),
      fetchEvents(),
      fetchInventory(),
      fetchInventoryLogs(),
    ]);

    const payload: Partial<AppState> = { staff };
    if (events.length > 0)        payload.events        = events;
    if (inventory.length > 0)     payload.inventory     = inventory;
    if (inventoryLogs.length > 0) payload.inventoryLogs = inventoryLogs;

    dispatch({ type: 'INIT_DATA', payload });
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Khôi phục profile từ bảng users
        const { data: profile } = await supabase
          .from('users').select('id, name, role').eq('id', session.user.id).single();
        if (profile) {
          dispatch({ type: 'LOGIN', payload: { id: profile.id, name: profile.name, role: profile.role } });
        }
        loadData();
      } else {
        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'INIT_DATA', payload: { staff: [] } });
      }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auth ---
  const login  = useCallback((user: CurrentUser) =>
    dispatch({ type: 'LOGIN', payload: user }), []);
  const logout = useCallback(() => {
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // --- Events ---
  const addEvent = useCallback((event: FestivalEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
    // Fire-and-forget Supabase write
    supabase.from('events').insert({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      status: event.status,
      income: event.financials.income,
      expenses: event.financials.expenses,
      inventory_reported: event.inventoryReported,
      booth: event.extra.booth,
      hygiene_permit: event.extra.hygienePermit,
      organizer_contact: event.extra.organizerContact,
    }).then();
  }, []);

  const updateEvent = useCallback((event: FestivalEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });
    supabase.from('events').update({
      name: event.name,
      date: event.date,
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
        date: expense.date,
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
      }).then();
    },
    []
  );

  const updateInventoryUnit = useCallback(
    (itemId: number, unit: InventoryUnit) => {
      dispatch({ type: 'UPDATE_INVENTORY_UNIT', payload: { itemId, unit } });
      supabase.from('inventory_items').update({ unit }).eq('id', itemId).then();
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
  const addStaff = useCallback((staff: StaffMember) => {
    dispatch({ type: 'ADD_STAFF', payload: staff });
    supabase.from('staff_members').insert({
      name: staff.name,
      dob: staff.dob,
      city: staff.city,
    }).then();
  }, []);

  const updateStaff = useCallback((staff: StaffMember) => {
    dispatch({ type: 'UPDATE_STAFF', payload: staff });
    supabase.from('staff_members').update({
      name:                    staff.name,
      dob:                     staff.dob,
      city:                    staff.city,
      carte_vitale_url:        staff.carteVitale?.url        ?? null,
      carte_vitale_name:       staff.carteVitale?.fileName   ?? null,
      carte_vitale_uploaded_at:staff.carteVitale?.uploadedAt ?? null,
      titre_sejour_url:        staff.titreSejour?.url        ?? null,
      titre_sejour_name:       staff.titreSejour?.fileName   ?? null,
      titre_sejour_uploaded_at:staff.titreSejour?.uploadedAt ?? null,
    }).eq('id', staff.id).then();
  }, []);

  const addContract = useCallback(
    (staffId: number, contract: StaffMember['contracts'][0]) => {
      dispatch({ type: 'ADD_CONTRACT', payload: { staffId, contract } });
      supabase.from('contracts').insert({
        staff_id: staffId,
        date: contract.date,
        url: contract.url,
        file_name: contract.fileName,
      }).then();
    },
    []
  );

  const value: AppContextValue = {
    state,
    login, logout,
    addEvent, updateEvent,
    addStaffToEvent, removeStaffFromEvent,
    addExpense, updateExpenseStatus,
    setInventoryItem, createInventoryItem, updateInventoryUnit, addInventoryLog,
    addStaff, updateStaff, addContract,
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
