import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';
import type { InventoryItem, InventoryLogEntry, InventoryUnit, InventoryCategory, InventoryLogAction } from '../../types';

export async function fetchInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*');

  if (error || !data || data.length === 0) {
    if (error) console.error('[api/inventory] fetchInventory error:', error.message);
    return [];
  }

  type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];

  return (data as InventoryItemRow[]).map((row): InventoryItem => ({
    id: row.id,
    name: row.name ?? '',
    current: row.current ?? 0,
    threshold: row.threshold ?? 0,
    unit: (row.unit ?? 'cái') as InventoryUnit,
    category: (row.category ?? 'food') as InventoryCategory,
  }));
}

export async function fetchInventoryLogs(): Promise<InventoryLogEntry[]> {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error || !data || data.length === 0) {
    if (error) console.error('[api/inventory] fetchInventoryLogs error:', error.message);
    return [];
  }

  type InventoryLogRow = Database['public']['Tables']['inventory_logs']['Row'];

  return (data as InventoryLogRow[]).map((row): InventoryLogEntry => ({
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

export async function setInventoryItem(itemId: number, qty: number): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({ current: qty }).eq('id', itemId);
  if (error) throw error;
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<void> {
  const { error } = await supabase.from('inventory_items').insert({
    name: item.name,
    current: item.current,
    threshold: item.threshold,
    unit: item.unit,
    category: item.category ?? 'food',
  });
  if (error) throw error;
}

export async function deleteInventoryItem(itemId: number): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function updateInventoryUnit(itemId: number, unit: InventoryUnit): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({ unit }).eq('id', itemId);
  if (error) throw error;
}

export async function updateInventoryItem(
  itemId: number,
  name: string,
  current: number,
  threshold: number,
  unit: InventoryUnit
): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .update({ name, current, threshold, unit })
    .eq('id', itemId);
  if (error) throw error;
}

export async function addInventoryLog(log: Omit<InventoryLogEntry, 'id'>): Promise<void> {
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
  if (error) throw error;
}
