import { useMemo, useState } from 'react';
import type { SortDescriptor } from 'react-aria-components';
import { Table } from '@heroui/react';
import { Package, SearchX } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { getItemStatus } from './useInventoryFilters';
import InventoryQuantityStepper from './InventoryQuantityStepper';
import type { InventoryItem } from '../../types';

interface Props {
  items: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  itemLabel: string;
  sectionLabel: string;
  isFiltered?: boolean;
}

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  low:  { label: 'Thiếu hàng', dot: 'bg-danger',  text: 'text-danger' },
  warn: { label: 'Cảnh báo',   dot: 'bg-warning', text: 'text-warning' },
  ok:   { label: 'Đủ hàng',    dot: 'bg-success', text: 'text-muted' },
};

const statusRank = (item: InventoryItem) => {
  const s = getItemStatus(item);
  return s === 'low' ? 0 : s === 'warn' ? 1 : 2;
};

export default function InventoryTable({ items, onEditItem, itemLabel, sectionLabel, isFiltered }: Props) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'status',
    direction: 'ascending',
  });

  const sorted = useMemo(() => {
    const list = [...items];
    const dir = sortDescriptor.direction === 'descending' ? -1 : 1;
    switch (sortDescriptor.column) {
      case 'name':      return list.sort((a, b) => dir * a.name.localeCompare(b.name, 'vi'));
      case 'current':   return list.sort((a, b) => dir * (a.current - b.current));
      case 'threshold': return list.sort((a, b) => dir * (a.threshold - b.threshold));
      default:          return list.sort((a, b) => dir * (statusRank(a) - statusRank(b) || a.name.localeCompare(b.name, 'vi')));
    }
  }, [items, sortDescriptor]);

  if (items.length === 0) {
    return isFiltered ? (
      <EmptyState icon={<SearchX size={26} />} title={`Không tìm thấy ${itemLabel} phù hợp`} />
    ) : (
      <EmptyState icon={<Package size={26} />} title={`Chưa có ${itemLabel} nào trong kho ${sectionLabel}`} />
    );
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label={`Danh sách ${itemLabel}`}
          className="min-w-[640px]"
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <Table.Header>
            <Table.Column isRowHeader allowsSorting id="name">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Tên</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="current">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Số lượng</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column id="unit">Đơn vị</Table.Column>
            <Table.Column allowsSorting id="threshold">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Ngưỡng</Table.SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="status">
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>Trạng thái</Table.SortableColumnHeader>
              )}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {sorted.map((item) => {
              const meta = STATUS_META[getItemStatus(item)];
              return (
                <Table.Row key={item.id} id={item.id} onAction={() => onEditItem(item)} className="cursor-pointer">
                  <Table.Cell>
                    <span className="font-semibold text-foreground">{item.name}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <InventoryQuantityStepper item={item} hideUnit />
                  </Table.Cell>
                  <Table.Cell><span className="text-muted">{item.unit}</span></Table.Cell>
                  <Table.Cell>
                    <span className="tabular-nums text-muted">{item.threshold > 0 ? item.threshold : '—'}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${meta.text}`}>
                      <span className={`size-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
