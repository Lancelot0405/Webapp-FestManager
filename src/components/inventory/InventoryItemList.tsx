import { motion } from 'framer-motion';
import { animations } from '../../lib/animations';
import ListSkeleton from '@/components/shared/skeletons/ListSkeleton';
import type { InventoryItem } from '../../types';
import InventoryItemRow from './InventoryItemRow';

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
  onEditItem: (item: InventoryItem) => void;
  itemLabel: string;
  sectionLabel: string;
  isFiltered?: boolean;
}

export default function InventoryItemList({ items, isLoading, onEditItem, itemLabel, sectionLabel, isFiltered }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 items-start">
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-10">
        {isFiltered
          ? `Không tìm thấy ${itemLabel} phù hợp`
          : `Chưa có ${itemLabel} nào trong kho ${sectionLabel}`}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 items-start">
      {items.map((item, i) => (
        <motion.div key={item.id} {...animations.listItem(i)}>
          <InventoryItemRow item={item} onEdit={onEditItem} />
        </motion.div>
      ))}
    </div>
  );
}
