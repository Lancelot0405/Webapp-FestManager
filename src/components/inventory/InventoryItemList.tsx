import { motion } from 'framer-motion';
import { Card } from '@heroui/react';
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
    return <ListSkeleton count={5} />;
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
    <Card className="!p-0 overflow-hidden">
      <ul className="divide-y divide-separator">
        {items.map((item, i) => (
          <motion.li key={item.id} {...animations.listItem(i)}>
            <InventoryItemRow item={item} onEdit={onEditItem} />
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
