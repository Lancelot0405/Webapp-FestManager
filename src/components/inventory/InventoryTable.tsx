import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortDescriptor } from 'react-aria-components';
import { Table } from '@heroui/react';
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

function SortHeader({ label, dir }: { label: string; dir?: 'ascending' | 'descending' }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      {dir === 'ascending' && <ChevronUp size={14} />}
      {dir === 'descending' && <ChevronDown size={14} />}
    </span>
  );
}

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
    return (
      <p className="text-sm text-muted text-center py-10">
        {isFiltered
          ? `Không tìm thấy ${itemLabel} phù hợp`
          : `Chưa có ${itemLabel} nào trong kho ${sectionLabel}`}
      </p>
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
              {({ sortDirection }) => <SortHeader label="Tên" dir={sortDirection} />}
            </Table.Column>
            <Table.Column allowsSorting id="current">
              {({ sortDirection }) => <SortHeader label="Số lượng" dir={sortDirection} />}
            </Table.Column>
            <Table.Column id="unit">Đơn vị</Table.Column>
            <Table.Column allowsSorting id="threshold">
              {({ sortDirection }) => <SortHeader label="Ngưỡng" dir={sortDirection} />}
            </Table.Column>
            <Table.Column allowsSorting id="status">
              {({ sortDirection }) => <SortHeader label="Trạng thái" dir={sortDirection} />}
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
