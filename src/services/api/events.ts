import { supabase } from '../../lib/supabase';
import { toISODate, fromISODate } from '../../lib/dateHelpers';
import type { Database, Json } from '../../types/database.types';
import type { FestivalEvent, StaffRef, Expense, ExpenseCategory, EventStatus, InventoryUnit, ExpenseStatus } from '../../types';

type EventWithStaffRow = Database['public']['Tables']['events']['Row'] & {
  event_staff: {
    staff_id: number;
    staff_members: {
      id: number;
      name: string;
      city: string | null;
      users: { role: string | null } | null;
    } | null;
  }[] | null;
};

export async function fetchEvents(): Promise<FestivalEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`*, event_staff(staff_id, staff_members(id, name, city, users(role)))`);

  if (error) {
    console.error('[api/events] fetchEvents error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const eventIds = data.map((e) => e.id);
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('*')
    .in('festival_id', eventIds);

  const expensesByEvent: Record<number, Database['public']['Tables']['expenses']['Row'][]> = {};
  for (const r of expensesData ?? []) {
    if (r.festival_id == null) continue;
    if (!expensesByEvent[r.festival_id]) expensesByEvent[r.festival_id] = [];
    expensesByEvent[r.festival_id].push(r);
  }

  return (data as EventWithStaffRow[]).map((row): FestivalEvent => {
    const staff: StaffRef[] = (row.event_staff ?? []).map((es) => {
      const sm = es.staff_members;
      return {
        id: sm?.id ?? es.staff_id,
        name: sm?.name ?? '',
        city: sm?.city ?? '',
      };
    });

    const breakdown = (row.expenses as Record<string, number> | null) ?? {};

    const receipts: Expense[] = (expensesByEvent[row.id] ?? []).map((r): Expense => ({
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
      endDate: row.end_date ? fromISODate(row.end_date) : undefined,
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
      inventoryReported: ((row.inventory_reported as { name?: string; current?: number; unit?: string }[]) ?? []).map((item) => ({
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

export async function createEvent(event: Omit<FestivalEvent, 'id' | 'receipts'>): Promise<number> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: event.name,
      date: toISODate(event.date),
      end_date: event.endDate ? toISODate(event.endDate) : null,
      location: event.location,
      status: event.status,
      income: event.financials.income,
      expenses: event.financials.expenses as unknown as Json,
      inventory_reported: event.inventoryReported as unknown as Json,
      booth: event.extra.booth,
      hygiene_permit: event.extra.hygienePermit,
      organizer_contact: event.extra.organizerContact,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateEvent(event: FestivalEvent): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      name: event.name,
      date: toISODate(event.date),
      end_date: event.endDate ? toISODate(event.endDate) : null,
      location: event.location,
      status: event.status,
      income: event.financials.income,
      expenses: event.financials.expenses as unknown as Json,
      inventory_reported: event.inventoryReported as unknown as Json,
      booth: event.extra.booth,
      hygiene_permit: event.extra.hygienePermit,
      organizer_contact: event.extra.organizerContact,
    })
    .eq('id', event.id);

  if (error) throw error;
}

export async function deleteEvent(eventId: number): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
  
  const { error: staffError } = await supabase.from('event_staff').delete().eq('event_id', eventId);
  if (staffError) throw staffError;
}

export async function addStaffToEvent(eventId: number, staffId: number): Promise<void> {
  const { error } = await supabase.from('event_staff').insert({ event_id: eventId, staff_id: staffId });
  if (error) throw error;
}

export async function removeStaffFromEvent(eventId: number, staffId: number): Promise<void> {
  const { error } = await supabase.from('event_staff').delete().eq('event_id', eventId).eq('staff_id', staffId);
  if (error) throw error;
}

export async function cloneEvent(event: FestivalEvent): Promise<number> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: `${event.name} (bản sao)`,
      date: toISODate(event.date),
      end_date: event.endDate ? toISODate(event.endDate) : null,
      location: event.location,
      status: 'Lên kế hoạch',
      income: 0,
      expenses: event.financials.expenses as unknown as Json,
      inventory_reported: [],
      booth: event.extra.booth,
      hygiene_permit: event.extra.hygienePermit,
      organizer_contact: event.extra.organizerContact,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
