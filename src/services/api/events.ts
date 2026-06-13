import { supabase } from '../../lib/supabase';
import { toISODate } from '../../lib/db';
import type { FestivalEvent, Expense, ExpenseStatus, ExpenseCategory } from '../../types';

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
