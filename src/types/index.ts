// =============================================================================
// FESTMANAGER — TYPE DEFINITIONS
// src/types/index.ts
// =============================================================================

// -----------------------------------------------------------------------------
// AUTH & USER
// -----------------------------------------------------------------------------

export type UserRole = 'admin' | 'manager' | 'staff';

export type UserDepartment = 'restaurant' | 'festival' | 'both';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  department?: UserDepartment | null;
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  requestedRole: 'manager';
  status: RegistrationStatus;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// STAFF & HR
// -----------------------------------------------------------------------------

export interface Contract {
  id: number;
  /** Date the contract was uploaded, format: DD-MM-YYYY */
  date: string;
  /** URL to the file — blob URL (dev) or Supabase Storage URL (prod) */
  url: string;
  fileName?: string;
  /** Which festival this contract belongs to (optional) */
  festivalId?: number;
}

export interface StaffDocument {
  url: string;
  fileName: string;
  uploadedAt: string;
}

export type StaffType = 'permanent' | 'part-time';

export interface StaffMember {
  id: number;
  userId?: string;
  name: string;
  dob: string;
  city: string;
  phone?: string;
  staffType: StaffType;
  contracts: Contract[];
  carteVitale?: StaffDocument;
  titreSejour?: StaffDocument;
  carteVitaleNumber?: string;
  titreSejeurNumber?: string;
}

// Lightweight version embedded inside Event.staff[]
// (avoids duplicating full StaffMember data in every event)
export interface StaffRef {
  id: number;
  name: string;
  city: string;
}

// -----------------------------------------------------------------------------
// EXPENSES / RECEIPTS
// -----------------------------------------------------------------------------

export type ExpenseCategory =
  | 'Vé tàu/xe'
  | 'Uber/Taxi'
  | 'Ăn uống'
  | 'Khác';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: number;
  staffId: string;
  staffName: string;
  festivalId: number;
  type: ExpenseCategory;
  amount: number;
  /** Format: DD-MM-YYYY */
  date: string;
  /** URL to the receipt image */
  imageUrl: string;
  status: ExpenseStatus;
}

// -----------------------------------------------------------------------------
// FINANCIALS
// -----------------------------------------------------------------------------

export interface EventExpenseBreakdown {
  /** Booth/venue rental fee */
  rent: number;
  /** Pre-purchased ingredients */
  ingredients: number;
  /** Staff travel costs (from Expenses, calculated automatically) */
  transport: number;
  /** Staff wages */
  staff: number;
  [key: string]: number; // allow extra categories
}

export interface EventFinancials {
  income: number;
  expenses: Partial<EventExpenseBreakdown>;
}

// -----------------------------------------------------------------------------
// INVENTORY
// -----------------------------------------------------------------------------

export type InventoryUnit =
  | 'kg'
  | 'g'
  | 'lít'
  | 'ml'
  | 'cái'
  | 'lon'
  | 'hộp'
  | 'xiên'
  | 'thùng'
  | 'phần'
  | 'túi'
  | 'đôi'
  | 'bộ'
  | 'chai'
  | 'cuộn'
  | 'chiếc';

export type InventoryCategory =
  | 'food'               // legacy → maps to restaurant-food
  | 'equipment'          // legacy → maps to restaurant-equipment
  | 'restaurant-food'
  | 'restaurant-equipment'
  | 'festival-food'
  | 'festival-equipment';

export interface InventoryItem {
  id: number;
  name: string;
  current: number;
  /** Alert triggers when current <= threshold */
  threshold: number;
  unit: InventoryUnit;
  category?: InventoryCategory;
}

export type InventoryLogAction = 'set' | 'created';

export interface InventoryLogEntry {
  id: number;
  itemId: number;
  itemName: string;
  /** Value that was set */
  qty: number;
  unit: InventoryUnit;
  action: InventoryLogAction;
  /** Which festival this report belongs to */
  festivalId: number | null;
  festivalName: string;
  /** Format: DD-MM-YYYY HH:mm */
  timestamp: string;
  /** Who submitted the report */
  submittedBy: string;
}

// -----------------------------------------------------------------------------
// EVENTS / FESTIVALS
// -----------------------------------------------------------------------------

export type EventStatus =
  | 'Lên kế hoạch'
  | 'Sắp tới'
  | 'Đang diễn ra'
  | 'Đã hoàn thành';

export interface EventExtra {
  booth: string;
  /** e.g. 'Đã duyệt' | 'Đang xin' | 'Chưa có' */
  hygienePermit: string;
  organizerContact: string;
}

export interface FestivalEvent {
  id: number;
  name: string;
  /** Format: DD-MM-YYYY */
  date: string;
  /** Format: DD-MM-YYYY — end date of the event */
  endDate?: string;
  location: string;
  status: EventStatus;
  staff: StaffRef[];
  financials: EventFinancials;
  /** Snapshot of remaining inventory reported at end of event */
  inventoryReported: Pick<InventoryItem, 'name' | 'current' | 'unit'>[];
  receipts: Expense[];
  extra: EventExtra;
}

// -----------------------------------------------------------------------------
// UI / APP STATE
// -----------------------------------------------------------------------------

/** Which top-level tab is active */
export type ActiveTab =
  | 'dashboard'
  | 'schedule'
  | 'inventory'
  | 'finance'
  | 'hr'
  | 'profile'
  | 'clients';

// -----------------------------------------------------------------------------
// CLIENTS
// -----------------------------------------------------------------------------

export interface Client {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  /** IDs of events associated with this client */
  eventIds: number[];
}

/** Result of parsing one line from the Smart Inventory Input */
export interface ParsedInventoryResult {
  name: string;
  qty: number;
  status: 'success' | 'error';
  action?: InventoryLogAction;
}