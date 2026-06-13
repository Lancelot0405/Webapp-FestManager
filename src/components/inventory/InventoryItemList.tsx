import { SkeletonList } from '@/components/ui/skeleton';
import type { InventoryItem } from '../../types';
import InventoryItemRow from './InventoryItemRow';

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
  onEditItem: (item: InventoryItem) => void;
  itemLabel: string;
  sectionLabel: string;
}

export default function InventoryItemList({ items, isLoading, onEditItem, itemLabel, sectionLabel }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <SkeletonList count={3} variant="row" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-10">
        Chưa có {itemLabel} nào trong kho {sectionLabel}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {items.map(item => (
        <InventoryItemRow key={item.id} item={item} onEdit={onEditItem} />
      ))}
    </div>
  );
}
