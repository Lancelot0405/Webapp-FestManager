import { useState } from 'react';
import type { CurrentUser, InventoryItem, InventoryLogEntry, InventoryUnit, InventoryCategory } from '../../types';

export type MainTab = 'restaurant' | 'festival';
export type SubTab = 'food' | 'equipment' | 'history';
export type StatusFilter = 'all' | 'low' | 'warn' | 'ok';
export type ItemStatus = 'low' | 'warn' | 'ok';

export function getItemStatus(item: InventoryItem): ItemStatus {
  if (item.current < item.threshold) return 'low';
  if (item.threshold > 0 && item.current < item.threshold * 1.5) return 'warn';
  return 'ok';
}

export const FOOD_UNITS: InventoryUnit[] = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'túi', 'gói', 'lốc', 'xiên', 'thùng', 'phần', 'con', 'miếng', 'thanh', 'viên', 'lọ', 'bình'];
export const EQUIP_UNITS: InventoryUnit[] = ['cái', 'chiếc', 'đôi', 'bộ', 'chai', 'cuộn', 'hộp', 'thùng', 'tấm', 'ổ', 'gói'];

export function getCategory(main: MainTab, sub: SubTab): InventoryCategory {
  if (main === 'restaurant') return sub === 'food' ? 'restaurant-food' : 'restaurant-equipment';
  return sub === 'food' ? 'festival-food' : 'festival-equipment';
}

function matchCategory(item: InventoryItem, main: MainTab, sub: 'food' | 'equipment'): boolean {
  const c = item.category;
  if (main === 'restaurant' && sub === 'food')
    return !c || c === 'food' || c === 'restaurant-food';
  if (main === 'restaurant' && sub === 'equipment')
    return c === 'equipment' || c === 'restaurant-equipment';
  if (main === 'festival' && sub === 'food')
    return c === 'festival-food';
  return c === 'festival-equipment';
}

export function useInventoryFilters(
  inventory: InventoryItem[],
  inventoryLogs: InventoryLogEntry[],
  currentUser: CurrentUser | null
) {
  const role = currentUser?.role;
  const dept = (role === 'admin' || role === 'manager')
    ? 'both'
    : (currentUser?.department ?? 'restaurant');
  const canSeeRestaurant = dept === 'restaurant' || dept === 'both';
  const canSeeFestival   = dept === 'festival'   || dept === 'both';
  const defaultTab: MainTab = canSeeRestaurant ? 'restaurant' : 'festival';

  const [mainTab, setMainTab] = useState<MainTab>(defaultTab);
  const [subTab,  setSubTab]  = useState<SubTab>('food');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredItems = subTab !== 'history'
    ? inventory.filter(item => matchCategory(item, mainTab, subTab as 'food' | 'equipment'))
    : [];

  const statusCounts = { all: filteredItems.length, low: 0, warn: 0, ok: 0 };
  for (const item of filteredItems) statusCounts[getItemStatus(item)]++;

  const countFor = (m: MainTab, s: 'food' | 'equipment') =>
    inventory.filter(item => matchCategory(item, m, s)).length;

  const sectionLogs = inventoryLogs.filter(log => {
    if (mainTab === 'restaurant') {
      return log.festivalName === 'Nhà hàng' || log.festivalName === 'Kiểm kho tổng' ||
        !!inventory.find(i => i.id === log.itemId && (!i.category || i.category === 'food' || i.category === 'restaurant-food' || i.category === 'restaurant-equipment' || i.category === 'equipment'));
    }
    return log.festivalName === 'Festival' ||
      !!inventory.find(i => i.id === log.itemId && (i.category === 'festival-food' || i.category === 'festival-equipment'));
  });

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setSubTab('food');
  };

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab);
  };

  return {
    mainTab,
    subTab,
    statusFilter,
    setStatusFilter,
    statusCounts,
    handleMainTabChange,
    handleSubTabChange,
    filteredItems,
    countFor,
    sectionLogs,
    canSeeRestaurant,
    canSeeFestival,
    sectionLabel: mainTab === 'restaurant' ? 'Nhà hàng' : 'Festival',
    itemLabel:    subTab === 'equipment' ? 'trang thiết bị' : 'thực phẩm',
    unitOptions:  subTab === 'equipment' ? EQUIP_UNITS : FOOD_UNITS,
    defaultUnit:  (subTab === 'equipment' ? 'cái' : 'kg') as InventoryUnit,
  };
}
