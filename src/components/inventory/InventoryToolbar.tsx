import { Search, Package, AlertTriangle } from 'lucide-react';
import { Card } from '@heroui/react';
import { Input } from '@/components/shared/GlassInput';
import { Select } from '@/components/shared/GlassSelect';

export type SortKey = 'status' | 'name' | 'qty-desc' | 'qty-asc';

const SORT_OPTIONS = [
  { value: 'status',   label: 'Sắp hết trước' },
  { value: 'name',     label: 'Tên (A–Z)' },
  { value: 'qty-desc', label: 'Số lượng nhiều → ít' },
  { value: 'qty-asc',  label: 'Số lượng ít → nhiều' },
];

interface Props {
  total: number;
  lowCount: number;
  itemLabel: string;
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
}

export default function InventoryToolbar({
  total, lowCount, itemLabel, search, onSearchChange, sort, onSortChange,
}: Props) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Package size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black leading-none tabular-nums text-foreground">{total}</p>
            <p className="text-[11px] text-muted truncate">Tổng {itemLabel}</p>
          </div>
        </Card>
        <Card className={`flex flex-row items-center gap-2.5 px-3 py-2.5 ${lowCount > 0 ? 'border-danger/30 bg-danger/5' : ''}`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${lowCount > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <p className={`text-lg font-black leading-none tabular-nums ${lowCount > 0 ? 'text-danger' : 'text-foreground'}`}>{lowCount}</p>
            <p className="text-[11px] text-muted truncate">Sắp hết hàng</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={search}
          onChange={onSearchChange}
          placeholder={`Tìm ${itemLabel}...`}
          startContent={<Search size={15} />}
          className="flex-1"
        />
        <Select
          value={sort}
          onChange={(v: string) => onSortChange(v as SortKey)}
          options={SORT_OPTIONS}
          className="sm:w-52 shrink-0"
        />
      </div>
    </div>
  );
}
