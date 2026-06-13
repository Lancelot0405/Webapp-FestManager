import { supabase } from '../../lib/supabase';
import type { InventoryItem, InventoryLogEntry, InventoryUnit } from '../../types';

export async function apiSetInventoryItem(itemId: number, qty: number): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({ current: qty }).eq('id', itemId);
  if (error) throw new Error(error.message);
}

export async function apiCreateInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<number> {
  const { data, error } = await supabase.from('inventory_items').insert({
    name: item.name,
    current: item.current,
    threshold: item.threshold,
    unit: item.unit,
    category: item.category ?? 'food',
  }).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as number;
}

export async function apiDeleteInventoryItem(itemId: number): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
  if (error) throw new Error(error.message);
}

export async function apiUpdateInventoryUnit(itemId: number, unit: InventoryUnit): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({ unit }).eq('id', itemId);
  if (error) throw new Error(error.message);
}

export async function apiUpdateInventoryItem(
  itemId: number,
  name: string,
  current: number,
  threshold: number,
  unit: InventoryUnit,
): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({ name, current, threshold, unit }).eq('id', itemId);
  if (error) throw new Error(error.message);
}

export async function apiAddInventoryLog(log: InventoryLogEntry): Promise<void> {
  const { error } = await supabase.from('inventory_logs').insert({
    item_id: log.itemId,
    item_name: log.itemName,
    qty: log.qty,
    unit: log.unit,
    action: log.action,
    festival_id: log.festivalId,
    festival_name: log.festivalName,
    timestamp: log.timestamp,
    submitted_by: log.submittedBy,
  });
  if (error) throw new Error(error.message);
}
