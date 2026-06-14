import { Search } from 'lucide-react';
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
  itemLabel: string;
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
}

export default function InventoryToolbar({
  itemLabel, search, onSearchChange, sort, onSortChange,
}: Props) {
  return (
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
  );
}
