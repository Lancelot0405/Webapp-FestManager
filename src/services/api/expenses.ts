import { supabase } from '../../lib/supabase';
import { toISODate } from '../../lib/dateHelpers';
import type { Expense, ExpenseStatus } from '../../types';

export async function addExpense(eventId: number, expense: Omit<Expense, 'id'>): Promise<number> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      staff_id: parseInt(String(expense.staffId), 10) || null,
      staff_name: expense.staffName,
      festival_id: expense.festivalId ?? eventId,
      type: expense.type,
      amount: expense.amount,
      date: toISODate(expense.date),
      image_url: expense.imageUrl,
      status: expense.status,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateExpenseStatus(_eventId: number, expenseId: number, status: ExpenseStatus): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ status })
    .eq('id', expenseId);

  if (error) throw error;
}
