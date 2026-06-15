import { SearchField, Select, ListBox } from '@heroui/react';

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
      <Select value={sort || null} onChange={(key) => { if (key != null) onSortChange(String(key) as SortKey); }} className="sm:w-52 shrink-0 flex flex-col gap-1">
        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
        <Select.Popover>
          <ListBox>
            {SORT_OPTIONS.map(opt => (
              <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>{opt.label}<ListBox.ItemIndicator /></ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
