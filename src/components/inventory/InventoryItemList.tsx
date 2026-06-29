import { motion } from 'framer-motion';
import { Pencil, Trash2, Package, SearchX } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
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
    return isFiltered ? (
      <EmptyState icon={<SearchX size={26} />} title={`Không tìm thấy ${itemLabel} phù hợp`} />
    ) : (
      <EmptyState icon={<Package size={26} />} title={`Chưa có ${itemLabel} nào trong kho ${sectionLabel}`} />
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
