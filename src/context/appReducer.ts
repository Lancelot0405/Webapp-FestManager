// =============================================================================
// FESTMANAGER — REDUCER & STATE SHAPE
// src/context/appReducer.ts
//
// Tách khỏi AppContext.tsx để: (1) reducer thuần test được độc lập,
// (2) file context chỉ export component (tránh lỗi react-refresh).
// =============================================================================

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

// =============================================================================
// 1. SHAPE CỦA GLOBAL STATE
// =============================================================================

export interface AppState {
  currentUser:            CurrentUser | null;
  events:                 FestivalEvent[];
  inventory:              InventoryItem[];
  inventoryLogs:          InventoryLogEntry[];
  staff:                  StaffMember[];
  clients:                Client[];
  pendingRegistrations:   RegistrationRequest[];
  loading:                boolean;
}

export const initialState: AppState = {
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

export type Action =
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

export function appReducer(state: AppState, action: Action): AppState {
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
