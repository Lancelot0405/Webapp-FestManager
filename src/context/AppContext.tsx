// =============================================================================
// FESTMANAGER — GLOBAL STATE MANAGEMENT
// src/context/AppContext.tsx
//
// Dùng React Context + useReducer thay thế toàn bộ useState trong App.tsx.
//
// NGUYÊN TẮC PHÂN CHIA:
//   - AppContext quản lý: dữ liệu nghiệp vụ (events, inventory, staff, user)
//   - State UI cục bộ (selectedEvent, showForm...): giữ trong từng component
// =============================================================================

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
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
  
  // =============================================================================
  // 1. SHAPE CỦA GLOBAL STATE
  // =============================================================================
  
  interface AppState {
    currentUser:    CurrentUser | null;
    events:         FestivalEvent[];
    inventory:      InventoryItem[];
    inventoryLogs:  InventoryLogEntry[];
    staff:          StaffMember[];
  }
  
  const initialState: AppState = {
    currentUser:   null,
    events:        MOCK_EVENTS,
    inventory:     MOCK_INVENTORY,
    inventoryLogs: MOCK_INVENTORY_LOGS,
    staff:         MOCK_STAFF,
  };
  
  // =============================================================================
  // 2. ĐỊNH NGHĨA TẤT CẢ ACTIONS
  // =============================================================================
  
  type Action =
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
  // 3. REDUCER — XỬ LÝ TỪNG ACTION
  // =============================================================================
  
  function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
  
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
            // Tránh thêm trùng
            const alreadyIn = e.staff.some(
              s => s.id === action.payload.staffRef.id
            );
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
  // 5. PROVIDER — BAO BỌC TOÀN BỘ APP
  // =============================================================================
  
  export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
  
    // --- Auth ---
    const login  = useCallback((user: CurrentUser) =>
      dispatch({ type: 'LOGIN', payload: user }), []);
    const logout = useCallback(() =>
      dispatch({ type: 'LOGOUT' }), []);
  
    // --- Events ---
    const addEvent    = useCallback((event: FestivalEvent) =>
      dispatch({ type: 'ADD_EVENT', payload: event }), []);
    const updateEvent = useCallback((event: FestivalEvent) =>
      dispatch({ type: 'UPDATE_EVENT', payload: event }), []);
  
    // --- Staff in event ---
    const addStaffToEvent = useCallback(
      (eventId: number, staffRef: FestivalEvent['staff'][0]) =>
        dispatch({ type: 'ADD_STAFF_TO_EVENT', payload: { eventId, staffRef } }),
      []
    );
    const removeStaffFromEvent = useCallback(
      (eventId: number, staffId: number) =>
        dispatch({ type: 'REMOVE_STAFF_FROM_EVENT', payload: { eventId, staffId } }),
      []
    );
  
    // --- Expenses ---
    const addExpense = useCallback(
      (eventId: number, expense: Expense) =>
        dispatch({ type: 'ADD_EXPENSE', payload: { eventId, expense } }),
      []
    );
    const updateExpenseStatus = useCallback(
      (eventId: number, expenseId: number, status: ExpenseStatus) =>
        dispatch({ type: 'UPDATE_EXPENSE_STATUS',
          payload: { eventId, expenseId, status } }),
      []
    );
  
    // --- Inventory ---
    const setInventoryItem = useCallback(
      (itemId: number, qty: number) =>
        dispatch({ type: 'SET_INVENTORY_ITEM', payload: { itemId, qty } }),
      []
    );
    const createInventoryItem = useCallback(
      (item: Omit<InventoryItem, 'id'>) =>
        dispatch({ type: 'CREATE_INVENTORY_ITEM', payload: item }),
      []
    );
    const updateInventoryUnit = useCallback(
      (itemId: number, unit: InventoryUnit) =>
        dispatch({ type: 'UPDATE_INVENTORY_UNIT', payload: { itemId, unit } }),
      []
    );
    const addInventoryLog = useCallback(
      (log: InventoryLogEntry) =>
        dispatch({ type: 'ADD_INVENTORY_LOG', payload: log }),
      []
    );
  
    // --- HR ---
    const addStaff    = useCallback((staff: StaffMember) =>
      dispatch({ type: 'ADD_STAFF', payload: staff }), []);
    const updateStaff = useCallback((staff: StaffMember) =>
      dispatch({ type: 'UPDATE_STAFF', payload: staff }), []);
    const addContract = useCallback(
      (staffId: number, contract: StaffMember['contracts'][0]) =>
        dispatch({ type: 'ADD_CONTRACT', payload: { staffId, contract } }),
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
  // 6. CUSTOM HOOK — Dùng trong mọi component
  // =============================================================================
  
  export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) {
      throw new Error('useApp() phải được dùng bên trong <AppProvider>.');
    }
    return ctx;
  }
  
  // Export thêm kiểu dữ liệu tiện dùng ở nơi khác
  export type { AppState };