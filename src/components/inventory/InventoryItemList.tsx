import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '@heroui/react';
import { animations } from '../../lib/animations';
import ListSkeleton from '@/components/shared/skeletons/ListSkeleton';
import SwipeableRow from '@/components/shared/SwipeableRow';
import { useDeleteInventoryItem } from '../../hooks/queries/mutations/useDeleteInventoryItem';
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
  const deleteMutation = useDeleteInventoryItem();

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

  const handleDelete = (item: InventoryItem) => {
    if (window.confirm(`Xóa "${item.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <ul className="divide-y divide-separator">
        {items.map((item, i) => (
          <motion.li key={item.id} {...animations.listItem(i)}>
            <SwipeableRow
              actions={[
                { icon: <Pencil size={16} />, label: 'Sửa', onClick: () => onEditItem(item), className: 'bg-accent text-white' },
                { icon: <Trash2 size={16} />, label: 'Xoá', onClick: () => handleDelete(item), className: 'bg-danger text-white' },
              ]}
            >
              <InventoryItemRow item={item} onEdit={onEditItem} />
            </SwipeableRow>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
