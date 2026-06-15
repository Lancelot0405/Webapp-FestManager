import { SearchField } from '@heroui/react';
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
      <SearchField value={search} onChange={onSearchChange} className="flex-1" aria-label={`Tìm ${itemLabel}`}>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder={`Tìm ${itemLabel}...`} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <Select
        value={sort}
        onChange={(v: string) => onSortChange(v as SortKey)}
        options={SORT_OPTIONS}
        className="sm:w-52 shrink-0"
      />
    </div>
  );
}
