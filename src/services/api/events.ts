import { supabase } from '../../lib/supabase';
import { toISODate, fromISODate } from '../../lib/dateHelpers';
import type {
  FestivalEvent,
  Expense,
  ExpenseStatus,
  ExpenseCategory,
  StaffRef,
  EventStatus,
  InventoryUnit,
} from '../../types';

export async function apiCreateEvent(event: FestivalEvent): Promise<number> {
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
  if (error) throw new Error(error.message);
  return data.id as number;
}

export async function apiUpdateEvent(event: FestivalEvent): Promise<void> {
  const { error } = await supabase.from('events').update({
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
  }).eq('id', event.id);
  if (error) throw new Error(error.message);
}

export async function apiDeleteEvent(eventId: number): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);
  await supabase.from('event_staff').delete().eq('event_id', eventId);
}

export async function apiCloneEvent(event: FestivalEvent): Promise<number> {
  const { data, error } = await supabase.from('events').insert({
    name: `${event.name} (bản sao)`,
    date: toISODate(event.date),
    end_date: event.endDate ? toISODate(event.endDate) : null,
    location: event.location,
    status: 'Lên kế hoạch',
    income: 0,
    expenses: event.financials.expenses,
    inventory_reported: [],
    booth: event.extra.booth,
    hygiene_permit: event.extra.hygienePermit,
    organizer_contact: event.extra.organizerContact,
  }).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as number;
}

export async function apiAddStaffToEvent(eventId: number, staffId: number): Promise<void> {
  const { error } = await supabase.from('event_staff').insert({ event_id: eventId, staff_id: staffId });
  if (error) throw new Error(error.message);
}

export async function apiRemoveStaffFromEvent(eventId: number, staffId: number): Promise<void> {
  const { error } = await supabase.from('event_staff').delete().eq('event_id', eventId).eq('staff_id', staffId);
  if (error) throw new Error(error.message);
}

export async function apiAddExpense(expense: Omit<Expense, 'id'>): Promise<number> {
  const { data, error } = await supabase.from('expenses').insert({
    staff_id: parseInt(String(expense.staffId), 10) || null,
    staff_name: expense.staffName,
    festival_id: expense.festivalId,
    type: expense.type as ExpenseCategory,
    amount: expense.amount,
    date: toISODate(expense.date),
    image_url: expense.imageUrl,
    status: expense.status,
  }).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as number;
}

export async function apiUpdateExpenseStatus(expenseId: number, status: ExpenseStatus): Promise<void> {
  const { error } = await supabase.from('expenses').update({ status }).eq('id', expenseId);
  if (error) throw new Error(error.message);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>;

export async function fetchEvents(): Promise<FestivalEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`*, event_staff(staff_id, staff_members(id, name, city, users(role)))`);

  if (error) {
    console.error('[api] fetchEvents error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const eventIds = data.map((e: DbRow) => e.id);
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('*')
    .in('festival_id', eventIds);

  const expensesByEvent: Record<number, DbRow[]> = {};
  for (const r of expensesData ?? []) {
    if (r.festival_id == null) continue;
    if (!expensesByEvent[r.festival_id]) expensesByEvent[r.festival_id] = [];
    expensesByEvent[r.festival_id].push(r);
  }

  return data.map((row: DbRow): FestivalEvent => {
    const staff: StaffRef[] = (row.event_staff ?? []).map((es: DbRow) => {
      const sm = es.staff_members;
      return { id: sm?.id ?? es.staff_id, name: sm?.name ?? '', city: sm?.city ?? '' };
    });

    const breakdown = row.expenses ?? {};
    const receipts: Expense[] = (expensesByEvent[row.id] ?? []).map((r: DbRow): Expense => ({
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
        expenses: { rent: breakdown.rent ?? 0, ingredients: breakdown.ingredients ?? 0, transport: breakdown.transport ?? 0, staff: breakdown.staff ?? 0, ...breakdown },
      },
      inventoryReported: (row.inventory_reported ?? []).map((item: DbRow) => ({
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
