import ListSkeleton from '@/components/shared/skeletons/ListSkeleton';
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-10">
        Chưa có {itemLabel} nào trong kho {sectionLabel}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
      {items.map(item => (
        <InventoryItemRow key={item.id} item={item} onEdit={onEditItem} />
      ))}
    </div>
  );
}
