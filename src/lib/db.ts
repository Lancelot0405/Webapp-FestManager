// =============================================================================
// FESTMANAGER — SUPABASE DATA FETCHERS
// src/lib/db.ts
// =============================================================================

import { supabase } from './supabase';
import type {
  StaffMember,
  FestivalEvent,
  InventoryItem,
  InventoryLogEntry,
  Expense,
  StaffRef,
  EventStatus,
  InventoryUnit,
  InventoryLogAction,
  ExpenseStatus,
  ExpenseCategory,
} from '../types';

// -----------------------------------------------------------------------------
// STAFF
// -----------------------------------------------------------------------------

export async function fetchStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*, contracts(*)');

  if (error || !data || data.length === 0) {
    if (error) console.error('[db] fetchStaff error:', error.message);
    return [];
  }

  return data.map((row: any): StaffMember => ({
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.name ?? '',
    dob: row.dob ?? '',
    city: row.city ?? '',
    contracts: (row.contracts ?? []).map((c: any) => ({
      id: c.id,
      date: fromISODate(c.date ?? ''),
      url: c.url ?? '',
      fileName: c.file_name ?? undefined,
      festivalId: c.festival_id ?? undefined,
    })),
    carteVitale: row.carte_vitale_url
      ? { url: row.carte_vitale_url, fileName: row.carte_vitale_name ?? '', uploadedAt: row.carte_vitale_uploaded_at ?? '' }
      : undefined,
    titreSejour: row.titre_sejour_url
      ? { url: row.titre_sejour_url, fileName: row.titre_sejour_name ?? '', uploadedAt: row.titre_sejour_uploaded_at ?? '' }
      : undefined,
  }));
}

// -----------------------------------------------------------------------------
// Date helpers — DB stores ISO (YYYY-MM-DD), app displays DD-MM-YYYY
// -----------------------------------------------------------------------------

export function toISODate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(ddmmyyyy)) return ddmmyyyy.slice(0, 10); // already ISO
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

export function fromISODate(iso: string): string {
  if (!iso) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(iso)) return iso; // already DD-MM-YYYY
  const part = iso.slice(0, 10); // strip time if present
  const [yyyy, mm, dd] = part.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

// -----------------------------------------------------------------------------
// EVENTS
// -----------------------------------------------------------------------------

export async function fetchEvents(): Promise<FestivalEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`*, event_staff(staff_id, staff_members(id, name, city, users(role))), receipts:expenses(*)`);

  if (error || !data || data.length === 0) {
    if (error) console.error('[db] fetchEvents error:', error.message);
    return [];
  }

  return data.map((row: any): FestivalEvent => {
    // Map staff from event_staff junction
    const staff: StaffRef[] = (row.event_staff ?? []).map((es: any) => {
      const sm = es.staff_members;
      return {
        id: sm?.id ?? es.staff_id,
        name: sm?.name ?? '',
        city: sm?.city ?? '',
      };
    });

    // expenses jsonb column = breakdown data
    const breakdown = row.expenses ?? {};

    // receipts alias = individual expense records
    const receipts: Expense[] = (row.receipts ?? []).map((r: any): Expense => ({
      id: r.id,
      staffId: String(r.staff_id ?? ''),
      staffName: r.staff_name ?? '',
      festivalId: r.festival_id ?? row.id,
      type: (r.type ?? 'Khác') as ExpenseCategory,
      amount: r.amount ?? 0,
      date: fromISODate(r.date ?? ''),
      imageUrl: r.image_url ?? '',
      status: (r.status ?? 'pending') as ExpenseStatus,
    }));

    return {
      id: row.id,
      name: row.name ?? '',
      date: fromISODate(row.date ?? ''),
      location: row.location ?? '',
      status: (row.status ?? 'Lên kế hoạch') as EventStatus,
      staff,
      financials: {
        income: row.income ?? 0,
        expenses: {
          rent: breakdown.rent ?? 0,
          ingredients: breakdown.ingredients ?? 0,
          transport: breakdown.transport ?? 0,
          staff: breakdown.staff ?? 0,
          ...breakdown,
        },
      },
      inventoryReported: (row.inventory_reported ?? []).map((item: any) => ({
        name: item.name ?? '',
        current: item.current ?? 0,
        unit: (item.unit ?? 'cái') as InventoryUnit,
      })),
      receipts,
      extra: {
        booth: row.booth ?? '',
        hygienePermit: row.hygiene_permit ?? '',
        organizerContact: row.organizer_contact ?? '',
      },
    };
  });
}

// -----------------------------------------------------------------------------
// INVENTORY
// -----------------------------------------------------------------------------

export async function fetchInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*');

  if (error || !data || data.length === 0) {
    if (error) console.error('[db] fetchInventory error:', error.message);
    return [];
  }

  return data.map((row: any): InventoryItem => ({
    id: row.id,
    name: row.name ?? '',
    current: row.current ?? 0,
    threshold: row.threshold ?? 0,
    unit: (row.unit ?? 'cái') as InventoryUnit,
  }));
}

// -----------------------------------------------------------------------------
// INVENTORY LOGS
// -----------------------------------------------------------------------------

export async function fetchInventoryLogs(): Promise<InventoryLogEntry[]> {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error || !data || data.length === 0) {
    if (error) console.error('[db] fetchInventoryLogs error:', error.message);
    return [];
  }

  return data.map((row: any): InventoryLogEntry => ({
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name ?? '',
    qty: row.qty ?? 0,
    unit: (row.unit ?? 'cái') as InventoryUnit,
    action: (row.action ?? 'set') as InventoryLogAction,
    festivalId: row.festival_id ?? null,
    festivalName: row.festival_name ?? '',
    timestamp: row.timestamp ?? '',
    submittedBy: row.submitted_by ?? '',
  }));
}
