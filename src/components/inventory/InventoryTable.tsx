import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface SortDescriptor {
  column: 'name' | 'current' | 'threshold' | 'status';
  direction: 'ascending' | 'descending';
}

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  low:  { label: 'Thiếu hàng', dot: 'bg-destructive',  text: 'text-destructive' },
  warn: { label: 'Cảnh báo',   dot: 'bg-warning', text: 'text-warning' },
  ok:   { label: 'Đủ hàng',    dot: 'bg-emerald-500', text: 'text-muted-foreground' },
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

  const handleSort = (column: SortDescriptor['column']) => {
    setSortDescriptor(prev => {
      const isAsc = prev.column === column && prev.direction === 'ascending';
      return {
        column,
        direction: isAsc ? 'descending' : 'ascending',
      };
    });
  };

  const renderSortArrow = (column: SortDescriptor['column']) => {
    if (sortDescriptor.column !== column) return null;
    return sortDescriptor.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  if (items.length === 0) {
    return isFiltered ? (
      <EmptyState icon={<SearchX size={26} />} title={`Không tìm thấy ${itemLabel} phù hợp`} />
    ) : (
      <EmptyState icon={<Package size={26} />} title={`Chưa có ${itemLabel} nào trong kho ${sectionLabel}`} />
    );
  }

  return (
    <div className="relative w-full overflow-auto rounded-xl border">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none text-xs font-semibold text-muted-foreground py-3 pl-4 pr-3 bg-muted/50 dark:bg-default-100/20">
              Tên{renderSortArrow('name')}
            </TableHead>
            <TableHead onClick={() => handleSort('current')} className="cursor-pointer select-none text-xs font-semibold text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20">
              Số lượng{renderSortArrow('current')}
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20">Đơn vị</TableHead>
            <TableHead onClick={() => handleSort('threshold')} className="cursor-pointer select-none text-xs font-semibold text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20">
              Ngưỡng{renderSortArrow('threshold')}
            </TableHead>
            <TableHead onClick={() => handleSort('status')} className="cursor-pointer select-none text-xs font-semibold text-muted-foreground py-3 px-3 bg-muted/50 dark:bg-default-100/20">
              Trạng thái{renderSortArrow('status')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => {
            const meta = STATUS_META[getItemStatus(item)];
            return (
              <TableRow
                key={item.id}
                onClick={() => onEditItem(item)}
                className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 dark:hover:bg-default-100/5 transition-colors"
              >
                <TableCell className="py-3.5 pl-4 pr-3">
                  <span className="font-semibold text-foreground">{item.name}</span>
                </TableCell>
                <TableCell className="py-3.5 px-3">
                  <InventoryQuantityStepper item={item} hideUnit />
                </TableCell>
                <TableCell className="py-3.5 px-3">
                  <span className="text-muted-foreground">{item.unit}</span>
                </TableCell>
                <TableCell className="py-3.5 px-3">
                  <span className="tabular-nums text-muted-foreground">{item.threshold > 0 ? item.threshold : '—'}</span>
                </TableCell>
                <TableCell className="py-3.5 px-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.text}`}>
                    <span className={`size-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
